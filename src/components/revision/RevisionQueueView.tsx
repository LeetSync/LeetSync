import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Input,
  Select,
  Icon,
  Tooltip,
  Collapse,
  Link,
  Card,
  CardBody,
  IconButton,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  BiLinkExternal,
  BiChevronDown,
  BiChevronUp,
  BiSliderAlt,
} from 'react-icons/bi';
import { PriorityBand, RankedProblem, ScoringWeights } from '../../types/Revision';
import { PriorityFormulaModal } from './PriorityFormulaModal';
import { RevisionTrackerModal } from './RevisionTrackerModal';

interface RevisionQueueViewProps {
  rankedQueue: RankedProblem[];
  allTopics: string[];
  currentWeights: ScoringWeights;
  onDataChanged: () => void;
  initialTopicFilter?: string;
}

export const RevisionQueueView: React.FC<RevisionQueueViewProps> = ({
  rankedQueue,
  allTopics,
  currentWeights,
  onDataChanged,
  initialTopicFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState(initialTopicFilter || 'All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [bandFilter, setBandFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'recency' | 'title'>('priority');
  const [expandedProblemSlug, setExpandedProblemSlug] = useState<string | null>(null);

  const [activeModalProblem, setActiveModalProblem] = useState<RankedProblem | null>(null);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  // Filter & sort logic
  const filteredProblems = useMemo(() => {
    return rankedQueue
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesSlug = p.slug.toLowerCase().includes(q);
          const matchesTag = (p.topicTags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesSlug && !matchesTag) return false;
        }

        // Topic filter
        if (topicFilter !== 'All') {
          if (!p.topicTags || !p.topicTags.includes(topicFilter)) return false;
        }

        // Difficulty filter
        if (difficultyFilter !== 'All' && p.difficulty !== difficultyFilter) {
          return false;
        }

        // Band filter
        if (bandFilter !== 'All' && p.priorityBand !== bandFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          return b.priorityScore - a.priorityScore;
        }
        if (sortBy === 'recency') {
          return b.daysSinceLastInteraction - a.daysSinceLastInteraction;
        }
        return a.title.localeCompare(b.title);
      });
  }, [rankedQueue, searchQuery, topicFilter, difficultyFilter, bandFilter, sortBy]);

  const immediateCount = rankedQueue.filter((p) => p.priorityBand === 'Immediate').length;
  const highCount = rankedQueue.filter((p) => p.priorityBand === 'High').length;
  const avgPriority =
    rankedQueue.length > 0
      ? Math.round(rankedQueue.reduce((acc, p) => acc + p.priorityScore, 0) / rankedQueue.length)
      : 0;

  const getBandBadge = (band: PriorityBand, score: number) => {
    let colorScheme = 'gray';
    if (band === 'Immediate') colorScheme = 'red';
    else if (band === 'High') colorScheme = 'orange';
    else if (band === 'Medium') colorScheme = 'blue';

    return (
      <Badge colorScheme={colorScheme} variant="solid" px={2} py={0.5} borderRadius="md" fontSize="xs">
        {score} / 100 • {band}
      </Badge>
    );
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'green';
    if (diff === 'Medium') return 'yellow';
    return 'red';
  };

  return (
    <VStack w="100%" spacing={4} align="stretch">
      {/* Priority Summary Cards */}
      <SimpleGrid columns={3} spacing={3}>
        <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" fontWeight="bold">
            Total In Queue
          </Text>
          <Text fontSize="xl" fontWeight="black">
            {rankedQueue.length}
          </Text>
          <Text fontSize="xs" color="gray.400">
            previously solved
          </Text>
        </Box>

        <Box p={3} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.100">
          <Text fontSize="xs" color="red.700" fontWeight="bold">
            Urgent Revisions
          </Text>
          <Text fontSize="xl" fontWeight="black" color="red.800">
            {immediateCount + highCount}
          </Text>
          <Text fontSize="xs" color="red.600">
            {immediateCount} Immediate, {highCount} High
          </Text>
        </Box>

        <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.100">
          <HStack justify="space-between">
            <Text fontSize="xs" color="blue.700" fontWeight="bold">
              Avg Priority
            </Text>
            <Tooltip label="Customize weights for recency, weak topics, and failed attempts">
              <IconButton
                aria-label="Customize weights"
                icon={<BiSliderAlt />}
                size="xs"
                variant="ghost"
                colorScheme="blue"
                onClick={() => setIsFormulaModalOpen(true)}
              />
            </Tooltip>
          </HStack>
          <Text fontSize="xl" fontWeight="black" color="blue.800">
            {avgPriority}/100
          </Text>
          <Text fontSize="xs" color="blue.600">
            dynamic ranking
          </Text>
        </Box>
      </SimpleGrid>

      {/* Filter and Control Bar */}
      <Box p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
        <VStack spacing={2} align="stretch">
          <HStack spacing={2}>
            <Input
              size="xs"
              placeholder="Search problem title or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
            />
            <Button
              size="xs"
              leftIcon={<Icon as={BiSliderAlt} />}
              variant="outline"
              colorScheme="blue"
              onClick={() => setIsFormulaModalOpen(true)}
              whiteSpace="nowrap"
            >
              Weights
            </Button>
          </HStack>

          <HStack spacing={2} wrap="wrap">
            <Select
              size="xs"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              w="140px"
              borderRadius="md"
            >
              <option value="All">All Topics</option>
              {allTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Select
              size="xs"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              w="110px"
              borderRadius="md"
            >
              <option value="All">All Diff</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Select>

            <Select
              size="xs"
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value)}
              w="120px"
              borderRadius="md"
            >
              <option value="All">All Urgency</option>
              <option value="Immediate">Immediate</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>

            <Select
              size="xs"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              w="130px"
              borderRadius="md"
            >
              <option value="priority">Priority: High to Low</option>
              <option value="recency">Oldest Solved</option>
              <option value="title">Problem Name</option>
            </Select>
          </HStack>
        </VStack>
      </Box>

      {/* Queue Problem List */}
      {filteredProblems.length === 0 ? (
        <Box p={6} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
          <Text fontSize="sm" color="gray.600" fontWeight="bold">
            No problems match your current filters.
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {rankedQueue.length === 0
              ? 'Solve problems on LeetCode while LeetSync is active to automatically populate your queue.'
              : 'Try clearing or relaxing your search query and filters.'}
          </Text>
        </Box>
      ) : (
        <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto" pr={1}>
          {filteredProblems.map((problem) => {
            const isExpanded = expandedProblemSlug === problem.slug;
            return (
              <Card
                key={problem.slug}
                size="sm"
                variant="outline"
                borderColor={
                  problem.priorityBand === 'Immediate'
                    ? 'red.200'
                    : problem.priorityBand === 'High'
                    ? 'orange.200'
                    : 'gray.200'
                }
                bg={
                  problem.priorityBand === 'Immediate'
                    ? 'red.50'
                    : problem.priorityBand === 'High'
                    ? '#fffaf0'
                    : 'white'
                }
              >
                <CardBody p={3}>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="center">
                      <HStack spacing={2} flex={1}>
                        {problem.frontendQuestionId && (
                          <Text fontSize="xs" fontWeight="bold" color="gray.500">
                            #{problem.frontendQuestionId}
                          </Text>
                        )}
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                          {problem.title}
                        </Text>
                        <Badge
                          size="xs"
                          colorScheme={getDifficultyColor(problem.difficulty)}
                          fontSize="2xs"
                        >
                          {problem.difficulty}
                        </Badge>
                      </HStack>

                      <HStack spacing={2}>
                        {getBandBadge(problem.priorityBand, problem.priorityScore)}
                        <Button
                          size="xs"
                          colorScheme="teal"
                          onClick={() => setActiveModalProblem(problem)}
                        >
                          Revise
                        </Button>
                        <Tooltip label="Open problem on LeetCode">
                          <Link
                            href={`https://leetcode.com/problems/${problem.slug}/`}
                            isExternal
                            display="flex"
                            alignItems="center"
                          >
                            <IconButton
                              aria-label="Open on LeetCode"
                              icon={<BiLinkExternal />}
                              size="xs"
                              variant="ghost"
                            />
                          </Link>
                        </Tooltip>
                      </HStack>
                    </HStack>

                    <HStack justify="space-between" align="center" fontSize="2xs" color="gray.500">
                      <HStack spacing={1} wrap="wrap">
                        {problem.topicTags && problem.topicTags.length > 0 ? (
                          problem.topicTags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="subtle" colorScheme="purple" fontSize="2xs">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline" colorScheme="gray" fontSize="2xs">
                            Untagged (Pending sync)
                          </Badge>
                        )}
                        {problem.topicTags && problem.topicTags.length > 3 && (
                          <Text fontSize="2xs" color="gray.400">
                            +{problem.topicTags.length - 3} more
                          </Text>
                        )}
                      </HStack>

                      <HStack spacing={3}>
                        <Text>
                          {problem.daysSinceLastInteraction === 0
                            ? 'Today'
                            : `${problem.daysSinceLastInteraction}d ago`}
                        </Text>
                        {problem.lastRevisionOutcome && (
                          <Badge
                            fontSize="2xs"
                            colorScheme={
                              problem.lastRevisionOutcome === 'independent'
                                ? 'green'
                                : problem.lastRevisionOutcome === 'hints'
                                ? 'yellow'
                                : 'red'
                            }
                          >
                            Last: {problem.lastRevisionOutcome}
                          </Badge>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          p={0}
                          h="auto"
                          fontSize="2xs"
                          color="blue.600"
                          rightIcon={
                            <Icon as={isExpanded ? BiChevronUp : BiChevronDown} />
                          }
                          onClick={() =>
                            setExpandedProblemSlug(isExpanded ? null : problem.slug)
                          }
                        >
                          {isExpanded ? 'Hide formula' : 'Score breakdown'}
                        </Button>
                      </HStack>
                    </HStack>

                    {/* Expandable Explanation Breakdown */}
                    <Collapse in={isExpanded} animateOpacity>
                      <Box
                        mt={2}
                        p={2.5}
                        bg="gray.50"
                        borderRadius="sm"
                        border="1px solid"
                        borderColor="gray.200"
                        fontSize="xs"
                      >
                        <Text fontWeight="bold" fontSize="2xs" color="gray.700" mb={1}>
                          Score Formula Breakdown ({problem.priorityScore}/100):
                        </Text>
                        <VStack align="stretch" spacing={1} fontSize="2xs">
                          <HStack justify="space-between">
                            <Text color="gray.600">
                              • Recency ({problem.explanation.recencyDays}d): {problem.explanation.recencyReason}
                            </Text>
                            <Badge colorScheme="blue">+{problem.explanation.recencyContribution} pts</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.600">
                              • Topic Weakness: {problem.explanation.topicReason}
                            </Text>
                            <Badge colorScheme="purple">+{problem.explanation.topicContribution} pts</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.600">
                              • Revision Outcome: {problem.explanation.outcomeReason}
                            </Text>
                            <Badge colorScheme="red">+{problem.explanation.outcomeContribution} pts</Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text color="gray.600">
                              • Submission Retries: {problem.explanation.attemptsReason}
                            </Text>
                            <Badge colorScheme="orange">+{problem.explanation.attemptsContribution} pts</Badge>
                          </HStack>

                          {problem.explanation.missingDataNotes.length > 0 && (
                            <Box mt={1} pt={1} borderTop="1px dashed" borderColor="gray.300">
                              {problem.explanation.missingDataNotes.map((note, idx) => (
                                <Text key={idx} color="gray.400" fontStyle="italic">
                                  ℹ {note}
                                </Text>
                              ))}
                            </Box>
                          )}
                        </VStack>
                      </Box>
                    </Collapse>
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Revision Active Modal */}
      <RevisionTrackerModal
        isOpen={!!activeModalProblem}
        onClose={() => setActiveModalProblem(null)}
        problem={activeModalProblem}
        onRevisionRecorded={onDataChanged}
      />

      {/* Priority Formula Configuration Modal */}
      <PriorityFormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        currentWeights={currentWeights}
        onWeightsUpdated={onDataChanged}
      />
    </VStack>
  );
};
