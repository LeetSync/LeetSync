import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Icon,
  Badge,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  BiBrain,
  BiListCheck,
  BiBarChartSquare,
  BiNetworkChart,
  BiCalendarCheck,
  BiHistory,
  BiRefresh,
  BiPlay,
} from 'react-icons/bi';
import {
  ProblemRecord,
  RankedProblem,
  RevisionTrackerStorageData,
  TopicPerformance,
  WeeklyReport,
} from '../../types/Revision';
import { RevisionStorageService } from '../../services/revisionStorage';
import { DSAPatternDetector } from '../../services/dsaPatternDetector';
import { RevisionPrioritizer } from '../../services/revisionPrioritizer';
import { ReportGenerator } from '../../services/reportGenerator';
import { RevisionQueueView } from './RevisionQueueView';
import { TopicAnalysisView } from './TopicAnalysisView';
import { WeeklyReportsView } from './WeeklyReportsView';
import { SimilarProblemsView } from './SimilarProblemsView';
import { RevisionHistoryView } from './RevisionHistoryView';
import { ProblemSyncStatus } from './ProblemSyncStatus';
import { RevisionTrackerModal } from './RevisionTrackerModal';

export const SmartRevisionTracker: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageData, setStorageData] = useState<RevisionTrackerStorageData | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [queueTopicFilter, setQueueTopicFilter] = useState<string>('All');

  // Quick revision modal for Next Recommended problem
  const [activeModalProblem, setActiveModalProblem] = useState<ProblemRecord | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RevisionStorageService.getInstance().loadData();
      setStorageData(data);
    } catch (err: any) {
      console.error('Failed to load revision tracker data:', err);
      setError(err?.message || 'Failed to load revision tracker data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived calculations
  const topicPerformances = useMemo<TopicPerformance[]>(() => {
    if (!storageData) return [];
    return DSAPatternDetector.analyzeTopics(storageData.problems, storageData.revisions);
  }, [storageData]);

  const rankedQueue = useMemo<RankedProblem[]>(() => {
    if (!storageData) return [];
    return RevisionPrioritizer.rankQueue(
      storageData.problems,
      topicPerformances,
      storageData.settings.weights
    );
  }, [storageData, topicPerformances]);

  const weeklyReport = useMemo<WeeklyReport | null>(() => {
    if (!storageData) return null;
    return ReportGenerator.generateWeeklyReport(
      storageData.problems,
      storageData.revisions,
      storageData.attempts
    );
  }, [storageData]);

  const allTopics = useMemo<string[]>(() => {
    return topicPerformances.map((t) => t.topic);
  }, [topicPerformances]);

  // Next due problem
  const nextRevisionProblem = rankedQueue.length > 0 ? rankedQueue[0] : null;

  const handleSelectTopicForQueue = (topic: string) => {
    setQueueTopicFilter(topic);
    setActiveTabIndex(1); // Switch to Queue tab
  };

  if (loading && !storageData) {
    return (
      <Box p={8} textAlign="center" w="100%">
        <Spinner size="md" color="teal.500" />
        <Text fontSize="xs" color="gray.500" mt={2}>
          Loading Smart Revision Tracker...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md" size="sm">
        <AlertIcon />
        <Text fontSize="xs">{error}</Text>
      </Alert>
    );
  }

  const problemsCount = storageData ? Object.keys(storageData.problems).length : 0;
  const revisionsCount = storageData ? storageData.revisions.length : 0;
  const topWeaknesses = topicPerformances.filter((t) => t.classification === 'Weakness');
  const topStrengths = topicPerformances.filter((t) => t.classification === 'Strength');

  return (
    <Box w="100%" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white" overflow="hidden">
      {/* Tracker Header */}
      <Box px={4} py={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Icon as={BiBrain} boxSize={5} color="teal.600" />
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="sm" fontWeight="black" color="gray.800">
                Smart Revision Tracker
              </Text>
              <Text fontSize="2xs" color="gray.500">
                DSA pattern detection, dynamic spaced repetition & honest reports
              </Text>
            </VStack>
          </HStack>

          <Button
            size="xs"
            leftIcon={<Icon as={BiRefresh} />}
            variant="ghost"
            onClick={loadData}
          >
            Refresh
          </Button>
        </HStack>
      </Box>

      {/* Sync Status Banner */}
      {storageData && (
        <Box px={4} pt={3}>
          <ProblemSyncStatus problems={storageData.problems} onSyncCompleted={loadData} />
        </Box>
      )}

      {/* Tab Navigation */}
      <Tabs
        index={activeTabIndex}
        onChange={(idx) => setActiveTabIndex(idx)}
        colorScheme="teal"
        size="sm"
        isLazy
      >
        <TabList px={4} pt={2} overflowX="auto" whiteSpace="nowrap">
          <Tab fontSize="xs" fontWeight="bold">
            <Icon as={BiBarChartSquare} mr={1} /> Overview
          </Tab>
          <Tab fontSize="xs" fontWeight="bold">
            <Icon as={BiListCheck} mr={1} /> Queue ({rankedQueue.length})
          </Tab>
          <Tab fontSize="xs" fontWeight="bold">
            <Icon as={BiBrain} mr={1} /> Topics ({topicPerformances.length})
          </Tab>
          <Tab fontSize="xs" fontWeight="bold">
            <Icon as={BiNetworkChart} mr={1} /> Similar
          </Tab>
          <Tab fontSize="xs" fontWeight="bold">
            <Icon as={BiCalendarCheck} mr={1} /> Reports
          </Tab>
          <Tab fontSize="xs" fontWeight="bold">
            <Icon as={BiHistory} mr={1} /> History ({revisionsCount})
          </Tab>
        </TabList>

        <TabPanels p={4}>
          {/* TAB 1: OVERVIEW */}
          <TabPanel p={0}>
            <VStack spacing={4} align="stretch">
              {/* Quick Summary Grid */}
              <SimpleGrid columns={3} spacing={3}>
                <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                  <Text fontSize="2xs" color="gray.500" fontWeight="bold">
                    Problems In Tracker
                  </Text>
                  <Text fontSize="xl" fontWeight="black">
                    {problemsCount}
                  </Text>
                  <Text fontSize="2xs" color="gray.400">
                    verified solves
                  </Text>
                </Box>

                <Box p={3} bg="teal.50" borderRadius="md" border="1px solid" borderColor="teal.100">
                  <Text fontSize="2xs" color="teal.700" fontWeight="bold">
                    Revisions Completed
                  </Text>
                  <Text fontSize="xl" fontWeight="black" color="teal.800">
                    {revisionsCount}
                  </Text>
                  <Text fontSize="2xs" color="teal.600">
                    spaced reviews
                  </Text>
                </Box>

                <Box p={3} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.100">
                  <Text fontSize="2xs" color="purple.700" fontWeight="bold">
                    Identified Weak Topics
                  </Text>
                  <Text fontSize="xl" fontWeight="black" color="purple.800">
                    {topWeaknesses.length}
                  </Text>
                  <Text fontSize="2xs" color="purple.600">
                    evidence-backed
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Next Revision Recommendation Card */}
              {nextRevisionProblem ? (
                <Card size="sm" variant="outline" bg="yellow.50" borderColor="yellow.200">
                  <CardBody p={3}>
                    <HStack justify="space-between" align="center">
                      <VStack align="flex-start" spacing={1}>
                        <HStack spacing={2}>
                          <Badge colorScheme="red" fontSize="2xs">
                            Top Revision Priority ({nextRevisionProblem.priorityScore}/100)
                          </Badge>
                          <Badge colorScheme="yellow" fontSize="2xs">
                            {nextRevisionProblem.priorityBand}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" fontWeight="bold">
                          {nextRevisionProblem.frontendQuestionId ? `#${nextRevisionProblem.frontendQuestionId} ` : ''}
                          {nextRevisionProblem.title}
                        </Text>
                        <Text fontSize="2xs" color="gray.600">
                          {nextRevisionProblem.explanation.outcomeReason ||
                            nextRevisionProblem.explanation.recencyReason}
                        </Text>
                      </VStack>

                      <Button
                        size="xs"
                        colorScheme="teal"
                        leftIcon={<Icon as={BiPlay} />}
                        onClick={() => setActiveModalProblem(nextRevisionProblem)}
                      >
                        Revise Now
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>
              ) : (
                <Box p={4} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
                  <Text fontSize="xs" color="gray.500">
                    No problems in revision queue yet. Solve problems on LeetCode to start tracking.
                  </Text>
                </Box>
              )}

              {/* Key Insights Overview */}
              <SimpleGrid columns={2} spacing={3}>
                <Card size="sm" variant="outline">
                  <CardBody p={3}>
                    <Text fontSize="xs" fontWeight="bold" color="red.700" mb={1.5}>
                      Top Focus Areas (Weaknesses):
                    </Text>
                    {topWeaknesses.length === 0 ? (
                      <Text fontSize="2xs" color="gray.500">
                        {problemsCount < 2
                          ? 'Insufficient data: Need more verified problem solves and revision logs.'
                          : 'No critical topic weaknesses identified so far!'}
                      </Text>
                    ) : (
                      <VStack align="flex-start" spacing={1}>
                        {topWeaknesses.slice(0, 3).map((w) => (
                          <HStack key={w.topic} justify="space-between" w="100%">
                            <Text fontSize="2xs" fontWeight="semibold">
                              • {w.topic}
                            </Text>
                            <Badge colorScheme="red" fontSize="2xs">
                              {w.masteryScore !== null ? `${w.masteryScore}% mastery` : 'Needs revision'}
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </CardBody>
                </Card>

                <Card size="sm" variant="outline">
                  <CardBody p={3}>
                    <Text fontSize="xs" fontWeight="bold" color="green.700" mb={1.5}>
                      Proven Strengths:
                    </Text>
                    {topStrengths.length === 0 ? (
                      <Text fontSize="2xs" color="gray.500">
                        Solve and independently revise problems across topics to confirm strengths.
                      </Text>
                    ) : (
                      <VStack align="flex-start" spacing={1}>
                        {topStrengths.slice(0, 3).map((s) => (
                          <HStack key={s.topic} justify="space-between" w="100%">
                            <Text fontSize="2xs" fontWeight="semibold">
                              • {s.topic}
                            </Text>
                            <Badge colorScheme="green" fontSize="2xs">
                              {s.masteryScore}% mastery
                            </Badge>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </SimpleGrid>
            </VStack>
          </TabPanel>

          {/* TAB 2: QUEUE */}
          <TabPanel p={0}>
            {storageData && (
              <RevisionQueueView
                rankedQueue={rankedQueue}
                allTopics={allTopics}
                currentWeights={storageData.settings.weights}
                onDataChanged={loadData}
                initialTopicFilter={queueTopicFilter}
              />
            )}
          </TabPanel>

          {/* TAB 3: TOPICS */}
          <TabPanel p={0}>
            <TopicAnalysisView
              topicPerformances={topicPerformances}
              onSelectTopicForQueue={handleSelectTopicForQueue}
            />
          </TabPanel>

          {/* TAB 4: SIMILAR */}
          <TabPanel p={0}>
            {storageData && (
              <SimilarProblemsView
                problems={storageData.problems}
                topicPerformances={topicPerformances}
                onDataChanged={loadData}
              />
            )}
          </TabPanel>

          {/* TAB 5: REPORTS */}
          <TabPanel p={0}>
            {weeklyReport && <WeeklyReportsView report={weeklyReport} />}
          </TabPanel>

          {/* TAB 6: HISTORY */}
          <TabPanel p={0}>
            {storageData && <RevisionHistoryView revisions={storageData.revisions} />}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal for Next Revision problem */}
      <RevisionTrackerModal
        isOpen={!!activeModalProblem}
        onClose={() => setActiveModalProblem(null)}
        problem={activeModalProblem}
        onRevisionRecorded={loadData}
      />
    </Box>
  );
};
