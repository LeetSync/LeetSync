import React, { useState } from 'react';
import {
  Box,
  HStack,
  Text,
  Button,
  Icon,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import { BiRefresh, BiCheckCircle, BiInfoCircle } from 'react-icons/bi';
import { ProblemRecord } from '../../types/Revision';
import { LeetCodeApiService } from '../../services/leetcodeApi';
import { RevisionStorageService } from '../../services/revisionStorage';

interface ProblemSyncStatusProps {
  problems: Record<string, ProblemRecord>;
  onSyncCompleted: () => void;
}

export const ProblemSyncStatus: React.FC<ProblemSyncStatusProps> = ({
  problems,
  onSyncCompleted,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(
    null
  );

  const problemList = Object.values(problems);
  const syncedCount = problemList.filter((p) => p.tagsSynced && p.topicTags && p.topicTags.length > 0)
    .length;
  const totalCount = problemList.length;
  const allSynced = totalCount > 0 && syncedCount === totalCount;

  const handleSyncTags = async () => {
    const unsynced = problemList.filter(
      (p) => !p.tagsSynced || !p.topicTags || p.topicTags.length === 0
    );

    if (unsynced.length === 0) return;

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: unsynced.length });

    const storage = RevisionStorageService.getInstance();
    let count = 0;

    for (const p of unsynced) {
      try {
        const details = await LeetCodeApiService.fetchQuestionDetails(p.slug);
        if (details && details.topicTags.length > 0) {
          await storage.updateProblemTags(
            p.slug,
            details.topicTags,
            details.frontendQuestionId,
            details.title
          );
        }
      } catch (err) {
        console.warn(`Tag sync failed for ${p.slug}:`, err);
      }
      count++;
      setSyncProgress({ current: count, total: unsynced.length });
    }

    setIsSyncing(false);
    setSyncProgress(null);
    onSyncCompleted();
  };

  if (totalCount === 0) return null;

  return (
    <Box
      p={2.5}
      bg={allSynced ? 'green.50' : 'blue.50'}
      borderRadius="md"
      border="1px solid"
      borderColor={allSynced ? 'green.200' : 'blue.200'}
      w="100%"
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={2}>
          <Icon
            as={allSynced ? BiCheckCircle : BiInfoCircle}
            color={allSynced ? 'green.500' : 'blue.500'}
            boxSize={4}
          />
          <Text fontSize="xs" fontWeight="semibold" color={allSynced ? 'green.800' : 'blue.800'}>
            Verified Problem Tags: {syncedCount}/{totalCount} problems verified
          </Text>
          <Tooltip label="Verified tags are fetched directly from LeetCode to ensure pattern detection is 100% accurate without guesswork.">
            <span>
              <Icon as={BiInfoCircle} color="gray.400" boxSize={3.5} />
            </span>
          </Tooltip>
        </HStack>

        {!allSynced && (
          <Button
            size="xs"
            colorScheme="blue"
            leftIcon={isSyncing ? <Spinner size="xs" /> : <Icon as={BiRefresh} />}
            onClick={handleSyncTags}
            isLoading={isSyncing}
            loadingText={
              syncProgress ? `Syncing ${syncProgress.current}/${syncProgress.total}` : 'Syncing...'
            }
          >
            Sync Tags with LeetCode
          </Button>
        )}
      </HStack>
    </Box>
  );
};
