import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { AgentDiff } from '@forge-ai/core';

interface Props {
  diffs: AgentDiff[];
  onAccept: (diff: AgentDiff) => void;
  onReject: (diff: AgentDiff) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export const DiffPreview: React.FC<Props> = ({
  diffs,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
}) => {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setCursor(c => Math.max(0, c - 1));
    if (key.downArrow) setCursor(c => Math.min(diffs.length - 1, c + 1));
    if (key.return) onAccept(diffs[cursor]);
    if (input === 'r' || input === 'R') onReject(diffs[cursor]);
    if (input === 'a' || input === 'A') onAcceptAll();
    if (key.escape) onRejectAll();
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
      <Text bold color="yellow">变更预览（共 {diffs.length} 个文件）</Text>

      {diffs.map((diff, index) => (
        <Box key={index} flexDirection="row" marginTop={1}>
          <Text color={index === cursor ? 'cyan' : 'gray'}>
            {index === cursor ? '❯ ' : '  '}
          </Text>
          <Text color="cyan">{index + 1}. {diff.file}</Text>
          {diff.description && (
            <Text dimColor> — {diff.description}</Text>
          )}
        </Box>
      ))}

      <Box marginTop={1} flexDirection="row" gap={2}>
        <Text color="green" bold>Enter</Text>
        <Text dimColor>接受选中</Text>
        <Text color="red" bold>R</Text>
        <Text dimColor>拒绝选中</Text>
        <Text color="green" bold>A</Text>
        <Text dimColor>全部接受</Text>
        <Text color="red" bold>Esc</Text>
        <Text dimColor>全部拒绝</Text>
      </Box>
    </Box>
  );
};