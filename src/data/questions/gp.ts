import type { SubjectBank } from '../../types';

export const gp: SubjectBank = {
  subject: 'gp',
  tiers: {
    A: {
      questions: [
        { prompt: 'In an argumentative essay, a "counterargument" is:', choices: ['your main point', 'an opposing view you address', 'the conclusion', 'a statistic'], answerIndex: 1, explanation: 'An opposing view, then rebutted.' },
        { prompt: 'A reliable source is generally one that is:', choices: ['anonymous', 'peer-reviewed or reputable', 'most recent only', 'shortest'], answerIndex: 1, explanation: 'Credible, verifiable authorship.' },
        { prompt: 'A "straw man" fallacy involves:', choices: ['attacking a distorted version of an argument', 'using statistics', 'citing experts', 'asking a question'], answerIndex: 0, explanation: 'Misrepresenting to refute easily.' },
        { prompt: 'Correlation does not imply:', choices: ['relationship', 'causation', 'data', 'trend'], answerIndex: 1, explanation: 'Two things linked need not cause each other.' },
        { prompt: '"Globalisation" most directly refers to increasing:', choices: ['national isolation', 'worldwide interconnectedness', 'local farming', 'censorship'], answerIndex: 1, explanation: 'Cross-border integration.' },
        { prompt: 'A balanced essay considers:', choices: ['one side only', 'multiple perspectives', 'no evidence', 'only emotion'], answerIndex: 1, explanation: 'Weighs differing viewpoints.' },
        { prompt: 'An "ad hominem" attack targets the:', choices: ['argument\'s logic', 'person rather than the argument', 'evidence', 'conclusion'], answerIndex: 1, explanation: 'Attacking the person, not the point.' },
        { prompt: 'A "primary source" is:', choices: ['a textbook summary', 'first-hand original evidence', 'an opinion column', 'a translation'], answerIndex: 1, explanation: 'Direct, original material.' },
        { prompt: 'Which is the best thesis statement?', choices: ['Technology is a thing.', 'While technology improves access to information, it can erode privacy.', 'I like technology.', 'Technology, computers, phones.'], answerIndex: 1, explanation: 'Arguable and specific.' },
        { prompt: '"Censorship" is the suppression of:', choices: ['taxes', 'information or expression', 'trade', 'population'], answerIndex: 1, explanation: 'Restricting speech/content.' },
        { prompt: 'A slippery-slope argument claims one step leads to:', choices: ['a balanced outcome', 'an extreme chain of consequences', 'no change', 'a statistic'], answerIndex: 1, explanation: 'Assumes inevitable escalation.' },
        { prompt: 'Sustainable development seeks to meet present needs without:', choices: ['economic growth', 'compromising future generations', 'using technology', 'global trade'], answerIndex: 1, explanation: 'Brundtland definition.' },
        { prompt: 'A good conclusion should:', choices: ['introduce new arguments', 'restate and synthesise key points', 'list sources', 'pose unrelated questions'], answerIndex: 1, explanation: 'Draws the argument together.' },
        { prompt: 'Bias in media often appears through:', choices: ['neutral facts', 'selective reporting and framing', 'page numbers', 'font size'], answerIndex: 1, explanation: 'Selection and framing shape perception.' },
        { prompt: 'A "hasty generalisation" draws a conclusion from:', choices: ['large samples', 'insufficient evidence', 'expert consensus', 'controlled trials'], answerIndex: 1, explanation: 'Too small a sample.' },
        { prompt: 'Which is an ethical consideration in scientific progress?', choices: ['profit only', 'impact on society and welfare', 'speed only', 'fame'], answerIndex: 1, explanation: 'Weighing societal consequences.' },
        { prompt: 'A "rhetorical question" is asked to:', choices: ['get a literal answer', 'make a point or provoke thought', 'gather data', 'end a paragraph'], answerIndex: 1, explanation: 'For effect, not an answer.' },
        { prompt: 'Cultural relativism is the idea that values are:', choices: ['universal', 'understood within their own culture', 'always wrong', 'fixed by law'], answerIndex: 1, explanation: 'Judged within cultural context.' },
        { prompt: 'A strong argument relies most on:', choices: ['emotive language alone', 'evidence and sound reasoning', 'repetition', 'length'], answerIndex: 1, explanation: 'Logic plus credible evidence.' },
        { prompt: '"Anecdotal evidence" is based on:', choices: ['large studies', 'personal stories', 'official statistics', 'experiments'], answerIndex: 1, explanation: 'Individual accounts, not data.' },
      ],
      matchSets: [
        {
          title: 'Match the fallacy to its description',
          pairs: [
            { left: 'Straw man', right: 'Distorting an argument' },
            { left: 'Ad hominem', right: 'Attacking the person' },
            { left: 'Slippery slope', right: 'Assuming a chain reaction' },
            { left: 'Hasty generalisation', right: 'Too little evidence' },
            { left: 'False dilemma', right: 'Only two options offered' },
            { left: 'Circular reasoning', right: 'Conclusion repeats premise' },
          ],
        },
        {
          title: 'Match the theme to a key issue',
          pairs: [
            { left: 'Environment', right: 'Climate change' },
            { left: 'Technology', right: 'Privacy and AI' },
            { left: 'Media', right: 'Misinformation' },
            { left: 'Science', right: 'Ethics of research' },
            { left: 'Globalisation', right: 'Cultural identity' },
            { left: 'Governance', right: 'Freedom vs security' },
          ],
        },
        {
          title: 'Match the essay part to its purpose',
          pairs: [
            { left: 'Introduction', right: 'States the thesis' },
            { left: 'Topic sentence', right: 'Opens a paragraph' },
            { left: 'Evidence', right: 'Supports a claim' },
            { left: 'Rebuttal', right: 'Answers the opposing view' },
            { left: 'Conclusion', right: 'Synthesises the argument' },
            { left: 'Counterargument', right: 'Presents the other side' },
          ],
        },
      ],
      balancePuzzles: [
        { kind: 'ordering', prompt: 'Order the structure of a balanced argument paragraph', tokens: ['Topic sentence', 'Explanation', 'Evidence', 'Analysis', 'Link to thesis'] },
        { kind: 'ordering', prompt: 'Order the stages of evaluating a claim', tokens: ['Identify the claim', 'Check the source', 'Weigh the evidence', 'Consider bias', 'Reach a judgement'] },
        { kind: 'ordering', prompt: 'Arrange a balanced thesis statement', tokens: ['Although globalisation', 'spreads prosperity,', 'it can also', 'widen inequality.'] },
        { kind: 'ordering', prompt: 'Order an argumentative essay', tokens: ['Introduction', 'Strongest argument', 'Supporting argument', 'Counter and rebuttal', 'Conclusion'] },
      ],
    },
  },
};
