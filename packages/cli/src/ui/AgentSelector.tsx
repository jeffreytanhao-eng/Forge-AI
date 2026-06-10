import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import type { CodingAgent } from '@forge-ai/core';

interface Props {
  agents: CodingAgent[];
  onSelect: (agentId: string) => void;
}

export const AgentSelector: React.FC<Props> = ({ agents, onSelect }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const items = agents.map(agent => ({
    label: `${agent.name} (${agent.id})`,
    value: agent.id,
  }));

  const handleSelect = (item: { value: string }) => {
    setSelected(item.value);
    onSelect(item.value);
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="cyan" bold>请选择要使用的 Agent：</Text>
      <Box marginTop={1}>
        <SelectInput items={items} onSelect={handleSelect} />
      </Box>
      {selected && (
        <Box marginTop={1}>
          <Text color="green">已选择: {selected}</Text>
        </Box>
      )}
    </Box>
  );
};