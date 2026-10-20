import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { RevisionLogEntry } from '../../types/Revision';

interface RevisionHistoryViewProps {
  revisions: RevisionLogEntry[];
}

export const RevisionHistoryView: React.FC<RevisionHistoryViewProps> = ({ revisions }) => {
  const sortedRevisions = [...revisions].sort((a, b) => b.timestamp - a.timestamp);

  const getOutcomeBadge = (outcome: string) => {
    if (outcome === 'independent') {
      return <Badge colorScheme="green">Solved Independently</Badge>;
    }
    if (outcome === 'hints') {
      return <Badge colorScheme="yellow">Needed Hints</Badge>;
    }
    return <Badge colorScheme="red">Could Not Solve</Badge>;
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return 'Untimed';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <VStack w="100%" spacing={3} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="xs" fontWeight="bold" color="gray.700">
          Revision Progress & History ({revisions.length} recorded session{revisions.length === 1 ? '' : 's'})
        </Text>
      </HStack>

      {sortedRevisions.length === 0 ? (
        <Box p={6} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
          <Text fontSize="sm" color="gray.600" fontWeight="bold">
            No revision history recorded yet.
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Click "Revise" on any problem in your queue to start tracking your revision sessions.
          </Text>
        </Box>
      ) : (
        <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto" pr={1}>
          {sortedRevisions.map((rev) => (
            <Card key={rev.id} size="sm" variant="outline" bg="white">
              <CardBody p={2.5}>
                <VStack align="stretch" spacing={1.5}>
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Text fontSize="xs" fontWeight="bold">
                        {rev.problemTitle}
                      </Text>
                      {getOutcomeBadge(rev.outcome)}
                    </HStack>
                    <Text fontSize="2xs" color="gray.400">
                      {formatDate(rev.timestamp)}
                    </Text>
                  </HStack>

                  <HStack justify="space-between" fontSize="2xs" color="gray.500">
                    <HStack spacing={1} wrap="wrap">
                      {rev.topicTags && rev.topicTags.map((tag) => (
                        <Badge key={tag} variant="subtle" colorScheme="purple" fontSize="2xs">
                          {tag}
                        </Badge>
                      ))}
                    </HStack>
                    <Text>
                      Duration: <b>{formatDuration(rev.durationSeconds)}</b>
                    </Text>
                  </HStack>

                  {rev.notes && (
                    <Box p={1.5} bg="gray.50" borderRadius="sm" fontSize="2xs" color="gray.700">
                      <b>Notes:</b> {rev.notes}
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
