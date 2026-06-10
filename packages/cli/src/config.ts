import Conf from 'conf';

interface ConfigSchema {
  defaultAgent?: string;
}

export const config = new Conf<ConfigSchema>({
  projectName: 'forge-ai',
  schema: {
    defaultAgent: {
      type: 'string',
    },
  },
});

export function getDefaultAgent(): string | undefined {
  return config.get('defaultAgent');
}

export function setDefaultAgent(agentId: string): void {
  config.set('defaultAgent', agentId);
}
