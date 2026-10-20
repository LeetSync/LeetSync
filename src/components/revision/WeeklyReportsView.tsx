import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { WeeklyReport } from '../../types/Revision';

interface WeeklyReportsViewProps {
  report: WeeklyReport;
}

export const WeeklyReportsView: React.FC<WeeklyReportsViewProps> = ({ report }) => {
  const { currentWeek, previousWeek, comparison } = report;

  const totalCurrentRevisions = currentWeek.revisionsCompleted;
  const indepPct =
    totalCurrentRevisions > 0
      ? Math.round((currentWeek.outcomeBreakdown.independent / totalCurrentRevisions) * 100)
      : 0;
  const hintsPct =
    totalCurrentRevisions > 0
      ? Math.round((currentWeek.outcomeBreakdown.hints / totalCurrentRevisions) * 100)
      : 0;
  const failedPct =
    totalCurrentRevisions > 0
      ? Math.round((currentWeek.outcomeBreakdown.failed / totalCurrentRevisions) * 100)
      : 0;

  const formatDuration = (sec: number | null) => {
    if (sec === null || sec === undefined) return 'Not timed';
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    if (mins === 0) return `${remainingSecs}s`;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <VStack w="100%" spacing={4} align="stretch">
      {/* Date Range Header */}
      <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <HStack justify="space-between" align="center" wrap="wrap">
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="xs" fontWeight="bold" color="gray.700">
              Reporting Periods (Local Date Boundaries):
            </Text>
            <Text fontSize="xs" color="gray.600">
              Current: <b>{currentWeek.startDate}</b> to <b>{currentWeek.endDate}</b>
            </Text>
          </VStack>
          <Text fontSize="2xs" color="gray.500">
            Previous: {previousWeek.startDate} to {previousWeek.endDate}
          </Text>
        </HStack>
      </Box>

      {/* Insufficient Data Alert if previous week has no activity */}
      {!comparison.hasSufficientHistoricalData && (
        <Alert status="info" size="sm" borderRadius="md" fontSize="xs">
          <AlertIcon />
          <Text fontSize="xs">
            {comparison.insufficientDataReason ||
              'Insufficient historical data in previous period to compute comparative progress.'}
          </Text>
        </Alert>
      )}

      {/* Comparative Metrics Grid */}
      <SimpleGrid columns={3} spacing={3}>
        <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontSize="2xs" color="gray.500" fontWeight="bold">
            Problems Solved
          </Text>
          <HStack align="baseline" spacing={2} mt={1}>
            <Text fontSize="2xl" fontWeight="black">
              {currentWeek.problemsSolved}
            </Text>
            {comparison.hasSufficientHistoricalData && comparison.solvedDelta !== undefined ? (
              <Badge
                colorScheme={comparison.solvedDelta >= 0 ? 'green' : 'red'}
                fontSize="2xs"
              >
                {comparison.solvedDelta >= 0 ? `+${comparison.solvedDelta}` : comparison.solvedDelta}{' '}
                vs prev
              </Badge>
            ) : (
              <Badge colorScheme="gray" fontSize="2xs">
                Baseline
              </Badge>
            )}
          </HStack>
          <Text fontSize="2xs" color="gray.400" mt={1}>
            {currentWeek.newProblemsSolved} first-time solves
          </Text>
        </Box>

        <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontSize="2xs" color="gray.500" fontWeight="bold">
            Revisions Completed
          </Text>
          <HStack align="baseline" spacing={2} mt={1}>
            <Text fontSize="2xl" fontWeight="black">
              {currentWeek.revisionsCompleted}
            </Text>
            {comparison.hasSufficientHistoricalData && comparison.revisionDelta !== undefined ? (
              <Badge
                colorScheme={comparison.revisionDelta >= 0 ? 'green' : 'red'}
                fontSize="2xs"
              >
                {comparison.revisionDelta >= 0
                  ? `+${comparison.revisionDelta}`
                  : comparison.revisionDelta}{' '}
                vs prev
              </Badge>
            ) : (
              <Badge colorScheme="gray" fontSize="2xs">
                Baseline
              </Badge>
            )}
          </HStack>
          <Text fontSize="2xs" color="gray.400" mt={1}>
            spaced reinforcement sessions
          </Text>
        </Box>

        <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontSize="2xs" color="gray.500" fontWeight="bold">
            Submission Retries / Failures
          </Text>
          <HStack align="baseline" spacing={2} mt={1}>
            <Text
              fontSize="2xl"
              fontWeight="black"
              color={currentWeek.failedAttempts > 0 ? 'red.600' : 'gray.800'}
            >
              {currentWeek.failedAttempts}
            </Text>
            <Text fontSize="xs" color="gray.500">
              / {currentWeek.totalAttempts} att.
            </Text>
          </HStack>
          <Text fontSize="2xs" color="gray.400" mt={1}>
            {currentWeek.totalAttempts > 0
              ? `${Math.round(
                  ((currentWeek.totalAttempts - currentWeek.failedAttempts) /
                    currentWeek.totalAttempts) *
                    100
                )}% first-try success`
              : 'No attempts logged'}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Revision Outcomes Distribution */}
      <Card size="sm" variant="outline">
        <CardBody p={3}>
          <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={2}>
            Weekly Revision Outcome Breakdown ({totalCurrentRevisions} total)
          </Text>

          {totalCurrentRevisions === 0 ? (
            <Text fontSize="xs" color="gray.400" py={2} textAlign="center">
              No revisions recorded during this 7-day period. Complete a revision session to track outcomes.
            </Text>
          ) : (
            <VStack spacing={2} align="stretch">
              <HStack spacing={1} h="12px" borderRadius="sm" overflow="hidden">
                {indepPct > 0 && <Box w={`${indepPct}%`} h="100%" bg="green.400" />}
                {hintsPct > 0 && <Box w={`${hintsPct}%`} h="100%" bg="yellow.400" />}
                {failedPct > 0 && <Box w={`${failedPct}%`} h="100%" bg="red.400" />}
              </HStack>

              <SimpleGrid columns={3} spacing={2} fontSize="2xs">
                <HStack>
                  <Box w={2} h={2} borderRadius="full" bg="green.400" />
                  <Text>
                    Indep: <b>{currentWeek.outcomeBreakdown.independent}</b> ({indepPct}%)
                  </Text>
                </HStack>
                <HStack>
                  <Box w={2} h={2} borderRadius="full" bg="yellow.400" />
                  <Text>
                    Hints: <b>{currentWeek.outcomeBreakdown.hints}</b> ({hintsPct}%)
                  </Text>
                </HStack>
                <HStack>
                  <Box w={2} h={2} borderRadius="full" bg="red.400" />
                  <Text>
                    Failed: <b>{currentWeek.outcomeBreakdown.failed}</b> ({failedPct}%)
                  </Text>
                </HStack>
              </SimpleGrid>
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Timed Session Duration */}
      <Card size="sm" variant="outline">
        <CardBody p={3}>
          <HStack justify="space-between" align="center">
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" fontWeight="bold" color="gray.700">
                Active Solving Duration (Timed Sessions Only)
              </Text>
              <Text fontSize="2xs" color="gray.500">
                Reliably measured via revision stopwatch • No inference from submission timestamps
              </Text>
            </VStack>
            <VStack align="flex-end" spacing={0}>
              <Text fontSize="sm" fontWeight="bold">
                {formatDuration(currentWeek.avgDurationSeconds)}
              </Text>
              <Text fontSize="2xs" color="gray.400">
                {currentWeek.timedRevisionCount} timed session{currentWeek.timedRevisionCount === 1 ? '' : 's'}
              </Text>
            </VStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Topics Practiced This Week */}
      <Card size="sm" variant="outline">
        <CardBody p={3}>
          <Text fontSize="xs" fontWeight="bold" color="gray.700" mb={2}>
            Topics Practiced in Current Period
          </Text>
          {Object.keys(currentWeek.topicBreakdown).length === 0 ? (
            <Text fontSize="xs" color="gray.400" textAlign="center" py={1}>
              No verified topic activity recorded this week.
            </Text>
          ) : (
            <HStack spacing={1.5} wrap="wrap">
              {Object.entries(currentWeek.topicBreakdown).map(([topic, counts]) => (
                <Badge key={topic} colorScheme="purple" variant="subtle" fontSize="2xs" px={2} py={0.5}>
                  {topic}: {counts.solved} solved, {counts.revisions} rev.
                </Badge>
              ))}
            </HStack>
          )}
        </CardBody>
      </Card>
    </VStack>
  );
};
