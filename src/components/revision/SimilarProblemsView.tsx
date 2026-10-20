import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Select,
  Button,
  Link,
  IconButton,
  Icon,
  Card,
  CardBody,
  Tooltip,
} from '@chakra-ui/react';
import { BiLinkExternal, BiBulb } from 'react-icons/bi';
import {
  ProblemRecord,
  SimilarProblemRecommendation,
  TopicPerformance,
} from '../../types/Revision';
import { RecommendationEngine } from '../../services/recommendationEngine';
import { RevisionTrackerModal } from './RevisionTrackerModal';

interface SimilarProblemsViewProps {
  problems: Record<string, ProblemRecord>;
  topicPerformances: TopicPerformance[];
  onDataChanged: () => void;
}

export const SimilarProblemsView: React.FC<SimilarProblemsViewProps> = ({
  problems,
  topicPerformances,
  onDataChanged,
}) => {
  const problemList = useMemo(() => Object.values(problems), [problems]);

  // Find a sensible default target problem: one with verified tags that is either weak or due
  const defaultSlug = useMemo(() => {
    const withTags = problemList.filter((p) => p.topicTags && p.topicTags.length > 0);
    return withTags.length > 0 ? withTags[0].slug : '';
  }, [problemList]);

  const [selectedSlug, setSelectedSlug] = useState<string>(defaultSlug);
  const [activeModalProblem, setActiveModalProblem] = useState<ProblemRecord | null>(null);

  // Update selectedSlug if default changes
  React.useEffect(() => {
    if (!selectedSlug && defaultSlug) {
      setSelectedSlug(defaultSlug);
    }
  }, [defaultSlug, selectedSlug]);

  const targetProblem = useMemo(() => {
    return problems[selectedSlug] || null;
  }, [problems, selectedSlug]);

  const recommendations = useMemo(() => {
    if (!targetProblem) {
      // General weak topic recommendations
      return RecommendationEngine.getWeakTopicRecommendations(problems, topicPerformances, 6);
    }
    const recs = RecommendationEngine.getSimilarProblems(
      targetProblem,
      problems,
      topicPerformances
    );
    if (recs.length === 0) {
      return RecommendationEngine.getWeakTopicRecommendations(problems, topicPerformances, 6);
    }
    return recs;
  }, [targetProblem, problems, topicPerformances]);

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'green';
    if (diff === 'Medium') return 'yellow';
    return 'red';
  };

  const getRelevanceColorScheme = (tag: SimilarProblemRecommendation['relevanceTag']) => {
    if (tag === 'Weak Topic Reinforcement') return 'red';
    if (tag === 'Due for Revision') return 'orange';
    return 'purple';
  };

  return (
    <VStack w="100%" spacing={4} align="stretch">
      {/* Target Problem Selection */}
      <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text fontSize="xs" fontWeight="bold" color="gray.700">
              Find Similar Problems Based on Verified Tags:
            </Text>
            <Tooltip label="Recommendations only match previously solved problems in your history sharing verified tags and weak patterns.">
              <span>
                <Icon as={BiBulb} color="purple.500" />
              </span>
            </Tooltip>
          </HStack>

          <Select
            size="xs"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            borderRadius="md"
            bg="white"
          >
            {problemList.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.frontendQuestionId ? `#${p.frontendQuestionId} ` : ''}
                {p.title} ({p.difficulty} • {p.topicTags?.length ? p.topicTags.join(', ') : 'Untagged'})
              </option>
            ))}
          </Select>

          {targetProblem && (
            <HStack spacing={1.5} wrap="wrap" pt={1}>
              <Text fontSize="2xs" color="gray.500">
                Target Tags:
              </Text>
              {targetProblem.topicTags && targetProblem.topicTags.length > 0 ? (
                targetProblem.topicTags.map((tag) => (
                  <Badge key={tag} colorScheme="purple" variant="solid" fontSize="2xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                <Text fontSize="2xs" color="gray.400" fontStyle="italic">
                  No verified tags synced yet for this problem.
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Box p={6} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
          <Text fontSize="sm" color="gray.600" fontWeight="bold">
            No similar problems found in your solve history.
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            Solve more problems sharing verified tags or click "Sync Tags" to verify existing problem tags.
          </Text>
        </Box>
      ) : (
        <VStack spacing={2.5} align="stretch" maxH="400px" overflowY="auto" pr={1}>
          {recommendations.map((rec) => {
            const p = rec.problem;
            return (
              <Card key={p.slug} size="sm" variant="outline" bg="white">
                <CardBody p={3}>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between" align="center">
                      <HStack spacing={2}>
                        {p.frontendQuestionId && (
                          <Text fontSize="xs" fontWeight="bold" color="gray.500">
                            #{p.frontendQuestionId}
                          </Text>
                        )}
                        <Text fontSize="sm" fontWeight="bold">
                          {p.title}
                        </Text>
                        <Badge
                          size="xs"
                          colorScheme={getDifficultyColor(p.difficulty)}
                          fontSize="2xs"
                        >
                          {p.difficulty}
                        </Badge>
                      </HStack>

                      <HStack spacing={2}>
                        <Badge
                          colorScheme={getRelevanceColorScheme(rec.relevanceTag)}
                          fontSize="2xs"
                          px={2}
                          py={0.5}
                        >
                          {rec.relevanceTag}
                        </Badge>
                        <Button
                          size="xs"
                          colorScheme="teal"
                          onClick={() => setActiveModalProblem(p)}
                        >
                          Revise
                        </Button>
                        <Tooltip label="Open problem on LeetCode">
                          <Link
                            href={`https://leetcode.com/problems/${p.slug}/`}
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

                    <HStack spacing={1} wrap="wrap">
                      <Text fontSize="2xs" color="gray.500">
                        Shared Concepts:
                      </Text>
                      {rec.sharedTags.map((tag) => (
                        <Badge key={tag} colorScheme="purple" variant="outline" fontSize="2xs">
                          {tag}
                        </Badge>
                      ))}
                    </HStack>

                    {/* Explanation */}
                    <Box p={2} bg="gray.50" borderRadius="sm" fontSize="2xs">
                      <Text color="gray.600">
                        <b>Why recommended:</b> {rec.reason}
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Revision Modal */}
      <RevisionTrackerModal
        isOpen={!!activeModalProblem}
        onClose={() => setActiveModalProblem(null)}
        problem={activeModalProblem}
        onRevisionRecorded={onDataChanged}
      />
    </VStack>
  );
};
