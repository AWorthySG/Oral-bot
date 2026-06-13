import type { SubjectBank } from '../../types';

export const economics: SubjectBank = {
  subject: 'econs',
  tiers: {
    A: {
      questions: [
        { prompt: 'The basic economic problem is:', choices: ['inflation', 'scarcity', 'taxation', 'trade'], answerIndex: 1, explanation: 'Unlimited wants, limited resources.' },
        { prompt: 'Opportunity cost is the:', choices: ['money price', 'next best alternative forgone', 'total cost', 'fixed cost'], answerIndex: 1, explanation: 'Value of the best forgone option.' },
        { prompt: 'A demand curve normally slopes:', choices: ['upward', 'downward', 'vertical', 'horizontal'], answerIndex: 1, explanation: 'Higher price, lower quantity demanded.' },
        { prompt: 'When demand rises with price held constant, the curve shifts:', choices: ['left', 'right', 'down', 'not at all'], answerIndex: 1, explanation: 'Rightward shift = increase in demand.' },
        { prompt: 'Price elasticity of demand measures responsiveness of quantity to:', choices: ['income', 'price', 'tax', 'supply'], answerIndex: 1, explanation: '%ΔQ / %ΔP.' },
        { prompt: 'A good with PED < 1 is described as:', choices: ['elastic', 'inelastic', 'unit elastic', 'perfectly elastic'], answerIndex: 1, explanation: 'Quantity changes less than price.' },
        { prompt: 'Inflation is a sustained rise in the general:', choices: ['wage rate only', 'price level', 'interest rate', 'exchange rate'], answerIndex: 1, explanation: 'General price level rising.' },
        { prompt: 'GDP measures a country\'s:', choices: ['population', 'total output of goods and services', 'tax revenue', 'money supply'], answerIndex: 1, explanation: 'Value of output produced.' },
        { prompt: 'A market failure occurs when resources are:', choices: ['allocated efficiently', 'allocated inefficiently', 'fully employed', 'exported'], answerIndex: 1, explanation: 'Free market misallocates resources.' },
        { prompt: 'A negative externality imposes costs on:', choices: ['the producer only', 'third parties', 'the government only', 'no one'], answerIndex: 1, explanation: 'Spillover cost to society.' },
        { prompt: 'A monopoly is a market with:', choices: ['many sellers', 'a single seller', 'two sellers', 'free entry'], answerIndex: 1, explanation: 'One dominant firm.' },
        { prompt: 'Fiscal policy involves government:', choices: ['interest rates', 'spending and taxation', 'money printing', 'tariffs only'], answerIndex: 1, explanation: 'Taxes and government spending.' },
        { prompt: 'Monetary policy is usually controlled by the:', choices: ['central bank', 'parliament', 'firms', 'households'], answerIndex: 0, explanation: 'Central bank sets rates/money supply.' },
        { prompt: 'A rise in interest rates tends to ___ investment.', choices: ['increase', 'decrease', 'not affect', 'double'], answerIndex: 1, explanation: 'Borrowing becomes costlier.' },
        { prompt: 'Comparative advantage is the basis for:', choices: ['inflation', 'international trade', 'unemployment', 'taxation'], answerIndex: 1, explanation: 'Specialise in lower opportunity cost goods.' },
        { prompt: 'A progressive tax takes a ___ proportion as income rises.', choices: ['smaller', 'larger', 'constant', 'zero'], answerIndex: 1, explanation: 'Higher earners pay a higher rate.' },
        { prompt: 'The multiplier effect means an injection raises national income by:', choices: ['the same amount', 'a larger amount', 'a smaller amount', 'zero'], answerIndex: 1, explanation: 'Successive rounds of spending.' },
        { prompt: 'Demand-pull inflation is caused by excess:', choices: ['supply', 'aggregate demand', 'imports', 'savings'], answerIndex: 1, explanation: 'AD exceeds productive capacity.' },
        { prompt: 'A public good is non-rival and:', choices: ['excludable', 'non-excludable', 'always cheap', 'imported'], answerIndex: 1, explanation: 'Cannot exclude non-payers.' },
        { prompt: 'Cyclical unemployment is linked to:', choices: ['seasons', 'the business cycle downturn', 'skills mismatch', 'job search'], answerIndex: 1, explanation: 'Caused by a fall in AD/recession.' },
      ],
      matchSets: [
        {
          title: 'Match the term to its definition',
          pairs: [
            { left: 'Scarcity', right: 'Limited resources' },
            { left: 'Opportunity cost', right: 'Next best alternative' },
            { left: 'Inflation', right: 'Rising price level' },
            { left: 'GDP', right: 'Total national output' },
            { left: 'Externality', right: 'Spillover effect' },
            { left: 'Monopoly', right: 'Single seller' },
          ],
        },
        {
          title: 'Match policy to its tool',
          pairs: [
            { left: 'Fiscal policy', right: 'Taxes and spending' },
            { left: 'Monetary policy', right: 'Interest rates' },
            { left: 'Supply-side policy', right: 'Boost productivity' },
            { left: 'Trade policy', right: 'Tariffs and quotas' },
            { left: 'Exchange rate policy', right: 'Currency intervention' },
            { left: 'Subsidy', right: 'Payment to producers' },
          ],
        },
        {
          title: 'Match elasticity to its description',
          pairs: [
            { left: 'PED', right: 'Demand vs price' },
            { left: 'YED', right: 'Demand vs income' },
            { left: 'XED', right: 'Demand vs other good price' },
            { left: 'PES', right: 'Supply vs price' },
            { left: 'Elastic', right: 'Responsive (>1)' },
            { left: 'Inelastic', right: 'Unresponsive (<1)' },
          ],
        },
      ],
      balancePuzzles: [
        { kind: 'ordering', prompt: 'Order the steps of the multiplier process', tokens: ['Injection of spending', 'Income rises', 'Households consume more', 'Further income rises', 'Larger final output'] },
        { kind: 'ordering', prompt: 'Order a typical business cycle', tokens: ['Boom', 'Downturn', 'Recession', 'Recovery', 'Boom again'] },
        { kind: 'coefficients', prompt: 'If marginal propensity to consume is 0.5, the multiplier 1/(1−MPC) = □', parts: ['Multiplier =', null], solution: [2] },
        { kind: 'ordering', prompt: 'Order from micro to macro scope', tokens: ['A single consumer', 'A firm', 'A market', 'A national economy', 'The global economy'] },
      ],
    },
  },
};
