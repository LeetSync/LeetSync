import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  SimpleGrid,
  Select,
  Button,
  Card,
  CardBody,
  Icon,
} from '@chakra-ui/react';
import {
  BiListUl,
} from 'react-icons/bi';
import { TopicClassification, TopicPerformance } from '../../types/Revision';

interface TopicAnalysisViewProps {
  topicPerformances: TopicPerformance[];
  onSelectTopicForQueue: (topic: string) => void;
}

export const TopicAnalysisView: React.FC<TopicAnalysisViewProps> = ({
  topicPerformances,
  onSelectTopicForQueue,
}) => {
  const [filterClassification, setFilterClassification] = useState<string>('All');

  const strengthCount = topicPerformances.filter((t) => t.classification === 'Strength').length;
  const weaknessCount = topicPerformances.filter((t) => t.classification === 'Weakness').length;
  const developingCount = topicPerformances.filter((t) => t.classification === 'Developing').length;
  const insufficientCount = topicPerformances.filter(
    (t) => t.classification === 'Insufficient data'
  ).length;

  const filteredTopics = topicPerformances.filter((t) => {
    if (filterClassification === 'All') return true;
    return t.classification === filterClassification;
  });

  const getClassificationBadge = (cls: TopicClassification) => {
    if (cls === 'Strength') {
      return (
        <Badge colorScheme="green" variant="solid" px={2} py={0.5} borderRadius="md" fontSize="xs">
          Strength
        </Badge>
      );
    }
    if (cls === 'Weakness') {
      return (
        <Badge colorScheme="red" variant="solid" px={2} py={0.5} borderRadius="md" fontSize="xs">
          Weakness
        </Badge>
      );
    }
    if (cls === 'Developing') {
      return (
        <Badge colorScheme="blue" variant="subtle" px={2} py={0.5} borderRadius="md" fontSize="xs">
          Developing
        </Badge>
      );
    }
    return (
      <Badge colorScheme="gray" variant="outline" px={2} py={0.5} borderRadius="md" fontSize="xs">
        Insufficient Data
      </Badge>
    );
  };

  return (
    <VStack w="100%" spacing={4} align="stretch">
      {/* Classification Overview Counters */}
      <SimpleGrid columns={4} spacing={2}>
        <Box p={2.5} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.100">
          <Text fontSize="2xs" color="red.700" fontWeight="bold">
            Weaknesses
          </Text>
          <Text fontSize="lg" fontWeight="black" color="red.800">
            {weaknessCount}
          </Text>
          <Text fontSize="2xs" color="red.600">
            need revision
          </Text>
        </Box>

        <Box p={2.5} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.100">
          <Text fontSize="2xs" color="green.700" fontWeight="bold">
            Strengths
          </Text>
          <Text fontSize="lg" fontWeight="black" color="green.800">
            {strengthCount}
          </Text>
          <Text fontSize="2xs" color="green.600">
            high mastery
          </Text>
        </Box>

        <Box p={2.5} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.100">
          <Text fontSize="2xs" color="blue.700" fontWeight="bold">
            Developing
          </Text>
          <Text fontSize="lg" fontWeight="black" color="blue.800">
            {developingCount}
          </Text>
          <Text fontSize="2xs" color="blue.600">
            in progress
          </Text>
        </Box>

        <Box p={2.5} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
          <Text fontSize="2xs" color="gray.600" fontWeight="bold">
            Insufficient
          </Text>
          <Text fontSize="lg" fontWeight="black" color="gray.800">
            {insufficientCount}
          </Text>
          <Text fontSize="2xs" color="gray.500">
            need more data
          </Text>
        </Box>
      </SimpleGrid>

      {/* Filter Header */}
      <HStack justify="space-between" align="center">
        <Text fontSize="xs" fontWeight="bold" color="gray.700">
          Verified Topic Performance ({filteredTopics.length} topics)
        </Text>
        <Select
          size="xs"
          w="160px"
          value={filterClassification}
          onChange={(e) => setFilterClassification(e.target.value)}
          borderRadius="md"
        >
          <option value="All">All Classifications</option>
          <option value="Weakness">Weaknesses Only</option>
          <option value="Strength">Strengths Only</option>
          <option value="Developing">Developing Only</option>
          <option value="Insufficient data">Insufficient Data</option>
        </Select>
      </HStack>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <Box p={6} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
          <Text fontSize="sm" color="gray.600" fontWeight="bold">
            No topics found for this filter.
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {topicPerformances.length === 0
              ? 'Solve problems with verified tags to generate DSA topic analysis.'
              : 'Try selecting All Classifications above.'}
          </Text>
        </Box>
      ) : (
        <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto" pr={1}>
          {filteredTopics.map((tp) => (
            <Card
              key={tp.topic}
              size="sm"
              variant="outline"
              borderColor={
                tp.classification === 'Weakness'
                  ? 'red.200'
                  : tp.classification === 'Strength'
                  ? 'green.200'
                  : 'gray.200'
              }
              bg={
                tp.classification === 'Weakness'
                  ? 'red.50'
                  : tp.classification === 'Strength'
                  ? 'green.50'
                  : 'white'
              }
            >
              <CardBody p={3}>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="bold">
                        {tp.topic}
                      </Text>
                      {getClassificationBadge(tp.classification)}
                    </HStack>
                    <Button
                      size="xs"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<Icon as={BiListUl} />}
                      onClick={() => onSelectTopicForQueue(tp.topic)}
                    >
                      Filter Queue
                    </Button>
                  </HStack>

                  {/* Mastery Progress Bar */}
                  <Box>
                    <HStack justify="space-between" mb={1} fontSize="2xs">
                      <Text color="gray.600">Calculated Mastery:</Text>
                      <Text fontWeight="bold">
                        {tp.masteryScore !== null ? `${tp.masteryScore}%` : 'Insufficient Data'}
                      </Text>
                    </HStack>
                    {tp.masteryScore !== null ? (
                      <Progress
                        value={tp.masteryScore}
                        size="xs"
                        borderRadius="sm"
                        colorScheme={
                          tp.masteryScore >= 75
                            ? 'green'
                            : tp.masteryScore >= 50
                            ? 'blue'
                            : 'red'
                        }
                      />
                    ) : (
                      <Progress value={0} size="xs" borderRadius="sm" bg="gray.200" isIndeterminate={false} />
                    )}
                  </Box>

                  {/* Supporting Evidence Metrics */}
                  <SimpleGrid columns={3} spacing={2} pt={1} fontSize="2xs">
                    <Box p={1.5} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
                      <Text color="gray.500">Problems Solved</Text>
                      <Text fontWeight="bold" fontSize="xs">
                        {tp.problemsSolved}
                      </Text>
                    </Box>
                    <Box p={1.5} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
                      <Text color="gray.500">Failed Attempts</Text>
                      <Text
                        fontWeight="bold"
                        fontSize="xs"
                        color={tp.failedAttempts > 0 ? 'red.600' : 'gray.800'}
                      >
                        {tp.failedAttempts} / {tp.totalAttempts}
                      </Text>
                    </Box>
                    <Box p={1.5} bg="white" borderRadius="sm" border="1px solid" borderColor="gray.200">
                      <Text color="gray.500">Revisions</Text>
                      <Text fontWeight="bold" fontSize="xs">
                        {tp.revisionsIndependent} indep / {tp.totalRevisions} total
                      </Text>
                    </Box>
                  </SimpleGrid>

                  {/* Evidence Explanation Box */}
                  <Box
                    p={2}
                    bg="white"
                    borderRadius="sm"
                    border="1px solid"
                    borderColor="gray.200"
                    fontSize="2xs"
                  >
                    <Text fontWeight="bold" color="gray.700" mb={0.5}>
                      Evidence-Backed Insight:
                    </Text>
                    <Text color="gray.600">{tp.evidenceSummary}</Text>
                    <VStack align="flex-start" spacing={0.5} mt={1} pl={1}>
                      {tp.evidenceDetails.map((detail, idx) => (
                        <Text key={idx} color="gray.500">
                          • {detail}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
