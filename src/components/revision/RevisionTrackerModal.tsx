import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Textarea,
  Box,
  Link,
  Icon,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { BiLinkExternal, BiPlay, BiPause, BiReset } from 'react-icons/bi';
import { ProblemRecord, RevisionOutcome } from '../../types/Revision';
import { RevisionStorageService } from '../../services/revisionStorage';

interface RevisionTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: ProblemRecord | null;
  onRevisionRecorded?: () => void;
}

export const RevisionTrackerModal: React.FC<RevisionTrackerModalProps> = ({
  isOpen,
  onClose,
  problem,
  onRevisionRecorded,
}) => {
  const [outcome, setOutcome] = useState<RevisionOutcome>('independent');
  const [notes, setNotes] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && problem) {
      setNotes(problem.notes || '');
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setOutcome('independent');
    }
  }, [isOpen, problem]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  if (!problem) return null;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleRecord = async () => {
    setIsSubmitting(true);
    try {
      await RevisionStorageService.getInstance().recordRevision({
        problemSlug: problem.slug,
        outcome,
        durationSeconds: timerSeconds > 0 ? timerSeconds : undefined,
        notes: notes.trim() || undefined,
      });
      if (onRevisionRecorded) onRevisionRecorded();
      onClose();
    } catch (err) {
      console.error('Failed to record revision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return 'green';
    if (diff === 'Medium') return 'yellow';
    return 'red';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader pb={1}>
          <HStack justify="space-between" align="center" pr={6}>
            <VStack align="flex-start" spacing={0}>
              <HStack>
                {problem.frontendQuestionId && (
                  <Text color="gray.500" fontSize="sm" fontWeight="bold">
                    #{problem.frontendQuestionId}
                  </Text>
                )}
                <Text fontSize="lg" fontWeight="bold">
                  {problem.title}
                </Text>
              </HStack>
              <HStack spacing={2} pt={1}>
                <Badge colorScheme={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
                {problem.topicTags && problem.topicTags.map((tag) => (
                  <Badge key={tag} variant="subtle" colorScheme="purple" fontSize="xs">
                    {tag}
                  </Badge>
                ))}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* LeetCode link */}
            <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
              <HStack justify="space-between">
                <Text fontSize="xs" color="gray.600">
                  Open problem on LeetCode to solve:
                </Text>
                <Link
                  href={`https://leetcode.com/problems/${problem.slug}/`}
                  isExternal
                  color="blue.600"
                  fontSize="xs"
                  fontWeight="bold"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  Solve on LeetCode <Icon as={BiLinkExternal} />
                </Link>
              </HStack>
            </Box>

            {/* Optional Stopwatch Timer */}
            <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.100">
              <HStack justify="space-between" align="center">
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xs" fontWeight="bold" color="blue.800">
                    Active Revision Stopwatch (Optional)
                  </Text>
                  <Text fontSize="xs" color="blue.600">
                    Records real solving time honestly (no timestamp inference)
                  </Text>
                </VStack>
                <HStack spacing={2}>
                  <Text fontFamily="mono" fontSize="xl" fontWeight="black" color="blue.900">
                    {formatTimer(timerSeconds)}
                  </Text>
                  <Button
                    size="xs"
                    colorScheme={isTimerRunning ? 'orange' : 'blue'}
                    leftIcon={<Icon as={isTimerRunning ? BiPause : BiPlay} />}
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    {isTimerRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Tooltip label="Reset Timer">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(0);
                      }}
                    >
                      <Icon as={BiReset} />
                    </Button>
                  </Tooltip>
                </HStack>
              </HStack>
            </Box>

            {/* Revision Outcome Selection */}
            <VStack align="flex-start" spacing={2}>
              <Text fontSize="sm" fontWeight="bold">
                How did your revision go?
              </Text>
              <HStack w="100%" spacing={2}>
                <Button
                  flex={1}
                  size="sm"
                  colorScheme={outcome === 'independent' ? 'green' : 'gray'}
                  variant={outcome === 'independent' ? 'solid' : 'outline'}
                  onClick={() => setOutcome('independent')}
                >
                  Solved Independently
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  colorScheme={outcome === 'hints' ? 'yellow' : 'gray'}
                  variant={outcome === 'hints' ? 'solid' : 'outline'}
                  onClick={() => setOutcome('hints')}
                >
                  Needed Hints
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  colorScheme={outcome === 'failed' ? 'red' : 'gray'}
                  variant={outcome === 'failed' ? 'solid' : 'outline'}
                  onClick={() => setOutcome('failed')}
                >
                  Could Not Solve
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                {outcome === 'independent' &&
                  'Great job! Successfully solved without hints or looking at the editorial.'}
                {outcome === 'hints' &&
                  'Needed assistance, clues, or a peek at algorithm/edge cases.'}
                {outcome === 'failed' &&
                  'Stuck or reviewed full solution. This problem will be prioritized for early follow-up.'}
              </Text>
            </VStack>

            <Divider />

            {/* Notes */}
            <VStack align="flex-start" spacing={1}>
              <Text fontSize="sm" fontWeight="bold">
                Revision Notes & Key Takeaways
              </Text>
              <Textarea
                placeholder="e.g. Remember off-by-one check on binary search, or state space optimization in DP..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                size="sm"
                rows={3}
              />
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleRecord}
            isLoading={isSubmitting}
            size="sm"
          >
            Save Revision Result
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
