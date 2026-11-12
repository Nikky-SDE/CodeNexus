import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { isValidCodeforcesProblemUrl } from '../utils/sanitize.js';

const router = express.Router();

const CF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

router.post('/generate-hints', async (req, res) => {
  const { problemUrl, apiKey } = req.body;

  if (typeof problemUrl !== 'string' || typeof apiKey !== 'string' || !problemUrl.trim() || !apiKey.trim()) {
    return res.status(400).json({ error: 'Valid problemUrl and apiKey are required.' });
  }

  const trimmedUrl = problemUrl.trim();
  if (!isValidCodeforcesProblemUrl(trimmedUrl)) {
    return res.status(400).json({
      error: 'Invalid URL. Please provide an official https://codeforces.com problem URL.',
    });
  }

  try {
    // 1. Fetch the Codeforces Problem Page safely via axios (no shell execution)
    let problemHtml = '';
    try {
      const problemRes = await axios.get(trimmedUrl, {
        headers: CF_HEADERS,
        timeout: 10000,
        maxRedirects: 3,
        responseType: 'text',
      });
      problemHtml = typeof problemRes.data === 'string' ? problemRes.data : '';
    } catch (err) {
      console.error('Codeforces problem fetch failed:', err.message);
      return res.status(400).json({ error: 'Failed to access the Codeforces problem URL.' });
    }

    if (!problemHtml || problemHtml.length < 100) {
      return res.status(400).json({ error: 'Failed to access the Codeforces problem URL. Received empty or blocked response.' });
    }

    const $ = cheerio.load(problemHtml);

    // 2. Find tutorial link on Codeforces
    let tutorialLink = null;
    $('.roundbox.sidebox a').each((_, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href');
      if ((text.includes('tutorial') || text.includes('editorial') || (href && href.includes('/blog/entry/'))) && !tutorialLink) {
        if (href) tutorialLink = href;
      }
    });

    if (!tutorialLink) {
      return res.status(404).json({ error: 'Could not find a tutorial link on the problem page.' });
    }

    if (!tutorialLink.startsWith('http')) {
      tutorialLink = `https://codeforces.com${tutorialLink.startsWith('/') ? '' : '/'}${tutorialLink}`;
    }

    // Ensure tutorial link stays on codeforces.com over HTTPS (prevents SSRF)
    let parsedTutorialUrl;
    try {
      parsedTutorialUrl = new URL(tutorialLink);
    } catch {
      return res.status(400).json({ error: 'Invalid tutorial link found on problem page.' });
    }
    if (parsedTutorialUrl.protocol !== 'https:' || parsedTutorialUrl.hostname !== 'codeforces.com') {
      return res.status(400).json({ error: 'Tutorial link points outside Codeforces and was blocked.' });
    }

    // 3. Fetch the tutorial blog page safely via axios
    let tutorialHtml = '';
    try {
      const tutorialRes = await axios.get(parsedTutorialUrl.toString(), {
        headers: CF_HEADERS,
        timeout: 10000,
        maxRedirects: 3,
        responseType: 'text',
      });
      tutorialHtml = typeof tutorialRes.data === 'string' ? tutorialRes.data : '';
    } catch (err) {
      console.error('Codeforces tutorial fetch failed:', err.message);
      return res.status(400).json({ error: 'Failed to fetch the Codeforces tutorial blog.' });
    }

    const $tut = cheerio.load(tutorialHtml);
    const rawEditorialText = $tut('.ttypography').text();
    if (!rawEditorialText || rawEditorialText.trim().length === 0) {
      return res.status(404).json({ error: 'Tutorial content is empty or unparsable.' });
    }

    const problemId = new URL(trimmedUrl).pathname.split('/').filter(Boolean).pop();

    // 4. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    let chosenModel = 'gemini-1.5-flash';
    let availableModels = [];
    try {
      const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`);
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        availableModels = (modelsData.models || [])
          .filter((m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map((m) => m.name.replace('models/', ''));

        if (availableModels.includes('gemini-2.5-flash')) chosenModel = 'gemini-2.5-flash';
        else if (availableModels.includes('gemini-2.0-flash')) chosenModel = 'gemini-2.0-flash';
        else if (availableModels.includes('gemini-1.5-flash')) chosenModel = 'gemini-1.5-flash';
        else {
          const flash = availableModels.find((m) => m.includes('flash') && !m.includes('vision'));
          const pro = availableModels.find((m) => m.includes('pro') && !m.includes('vision'));
          if (flash) chosenModel = flash;
          else if (pro) chosenModel = pro;
        }
      }
    } catch {
      console.log('Failed to fetch models list, using fallback.');
    }

    let outputText = null;

    const prompt = `
You are an expert competitive programming instructor.
I will give you the text of a Codeforces editorial blog post. This blog might contain solutions for multiple problems.
The user is asking for hints for the problem related to this URL: ${trimmedUrl} (Look for Problem ${problemId}).

Find the editorial part relevant to that specific problem, and then generate a JSON response strictly following this schema without any markdown formatting wrappers (like \`\`\`json):

{
  "directionToThink": "1-3 concise lines mentioning core concepts like greedy, dp, graphs, etc.",
  "hints": [
    {
      "hint": "progressive hint text from beginner to advanced...",
      "catch": "a common mistake or misconception related to this hint"
    }
  ],
  "editorial": [
    { "title": "Observation", "content": "..." },
    { "title": "Key Idea", "content": "..." },
    { "title": "Approach", "content": "..." },
    { "title": "Complexity", "content": "..." }
  ],
  "solutionCode": "clean, optimized C++ code with meaningful comments",
  "solutionExplanation": "short explanation of how the code works"
}

Important Rules:
- DO NOT wrap the output in markdown. Just return raw JSON.
- DO NOT copy the original editorial text directly. Rephrase everything in simple, beginner-friendly language.
- Number of hints: 4 to 8 (depending on complexity).
- Ensure hints gradually increase in difficulty and guide the user closer to the solution WITHOUT revealing it completely.

Here is the editorial text:
"""
${rawEditorialText.substring(0, 50000)}
"""
`;

    let selectedModels = [];
    if (availableModels.length > 0) {
      if (availableModels.includes('gemini-2.5-flash')) selectedModels.push('gemini-2.5-flash');
      if (availableModels.includes('gemini-2.0-flash')) selectedModels.push('gemini-2.0-flash');
      if (availableModels.includes('gemini-1.5-flash')) selectedModels.push('gemini-1.5-flash');
      const extraFlash = availableModels.find((m) => m.includes('flash') && !m.includes('vision') && !selectedModels.includes(m));
      if (extraFlash) selectedModels.push(extraFlash);
      const extraPro = availableModels.find((m) => m.includes('pro') && !m.includes('vision'));
      if (extraPro) selectedModels.push(extraPro);
      if (selectedModels.length === 0) selectedModels.push(chosenModel);
    } else {
      selectedModels = [chosenModel];
    }

    for (const m of selectedModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent(prompt);
        outputText = result.response.text();
        break;
      } catch (err) {
        console.error(`Generation failed with ${m}:`, err.message);
      }
    }

    if (!outputText) {
      return res.status(503).json({ error: 'AI hint generation is temporarily unavailable. Check your API key or try again.' });
    }

    if (outputText.startsWith('```json')) {
      outputText = outputText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (outputText.startsWith('```')) {
      outputText = outputText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsedData = JSON.parse(outputText);
      return res.json(parsedData);
    } catch {
      console.error('Gemini JSON Parse Error');
      return res.status(502).json({ error: 'Failed to parse structured response from Gemini.' });
    }
  } catch (error) {
    console.error('AI Editorial Error:', error);
    return res.status(500).json({ error: 'An error occurred during AI generation.' });
  }
});

export default router;
