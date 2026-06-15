import { ClaudeAgent as CoreClaudeAgent } from '@forge-ai/core';

export class ClaudeAgent extends CoreClaudeAgent {
  constructor(apiKey: string) {
    super(apiKey);
  }
}