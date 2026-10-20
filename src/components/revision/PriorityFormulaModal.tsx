import React, { useState, useEffect } from 'react';
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
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Divider,
  Code,
  Badge,
} from '@chakra-ui/react';
import { DEFAULT_SCORING_WEIGHTS, ScoringWeights } from '../../types/Revision';
import { RevisionStorageService } from '../../services/revisionStorage';

interface PriorityFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeights: ScoringWeights;
  onWeightsUpdated?: () => void;
}

export const PriorityFormulaModal: React.FC<PriorityFormulaModalProps> = ({
  isOpen,
  onClose,
  currentWeights,
  onWeightsUpdated,
}) => {
  const [weights, setWeights] = useState<ScoringWeights>({ ...currentWeights });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWeights({ ...currentWeights });
    }
  }, [isOpen, currentWeights]);

  const rawSum =
    weights.weightTimeSinceSolve +
    weights.weightTopicWeakness +
    weights.weightFailedAttempts +
    weights.weightRevisionOutcome;

  const pct = (w: number) => {
    if (rawSum <= 0) return 25;
    return Math.round((w / rawSum) * 100);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await RevisionStorageService.getInstance().updateWeights(weights);
      if (onWeightsUpdated) onWeightsUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_SCORING_WEIGHTS });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader pb={1}>
          <Text fontSize="md" fontWeight="bold">
            Prioritization Formula & Weight Configuration
          </Text>
          <Text fontSize="xs" color="gray.500">
            Transparent, normalized ranking formula with no hidden penalties
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
              <Text fontSize="xs" fontWeight="bold" mb={1} color="gray.700">
                Active Scoring Formula:
              </Text>
              <Code fontSize="xs" p={2} borderRadius="sm" display="block" whiteSpace="pre-wrap">
                Score (0-100) = [Time Since Solve ({pct(weights.weightTimeSinceSolve)}%) × Recency Factor]
                + [Topic Weakness ({pct(weights.weightTopicWeakness)}%) × Topic Factor]
                + [Failed Attempts ({pct(weights.weightFailedAttempts)}%) × Attempt Factor]
                + [Revision Outcome ({pct(weights.weightRevisionOutcome)}%) × Outcome Factor]
              </Code>
            </Box>

            <Divider />

            {/* Slider 1: Recency */}
            <VStack align="stretch" spacing={1}>
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="bold">
                  Time Since Last Solve/Revision
                </Text>
                <Badge colorScheme="blue">{pct(weights.weightTimeSinceSolve)}%</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Spaced repetition factor: problems not revised recently gain higher priority.
              </Text>
              <Slider
                aria-label="time-since-solve-weight"
                value={weights.weightTimeSinceSolve * 100}
                min={5}
                max={60}
                step={5}
                onChange={(val) =>
                  setWeights((prev) => ({ ...prev, weightTimeSinceSolve: val / 100 }))
                }
              >
                <SliderTrack>
                  <SliderFilledTrack bg="blue.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>

            {/* Slider 2: Topic Weakness */}
            <VStack align="stretch" spacing={1}>
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="bold">
                  Verified Topic Weakness
                </Text>
                <Badge colorScheme="purple">{pct(weights.weightTopicWeakness)}%</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Problems belonging to topics with high failure/hint rates receive higher urgency.
              </Text>
              <Slider
                aria-label="topic-weakness-weight"
                value={weights.weightTopicWeakness * 100}
                min={5}
                max={60}
                step={5}
                onChange={(val) =>
                  setWeights((prev) => ({ ...prev, weightTopicWeakness: val / 100 }))
                }
              >
                <SliderTrack>
                  <SliderFilledTrack bg="purple.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>

            {/* Slider 3: Failed Attempts */}
            <VStack align="stretch" spacing={1}>
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="bold">
                  Failed Submission Attempts / Retries
                </Text>
                <Badge colorScheme="orange">{pct(weights.weightFailedAttempts)}%</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Problems where you struggled or had wrong answers / TLEs before accepting.
              </Text>
              <Slider
                aria-label="failed-attempts-weight"
                value={weights.weightFailedAttempts * 100}
                min={5}
                max={60}
                step={5}
                onChange={(val) =>
                  setWeights((prev) => ({ ...prev, weightFailedAttempts: val / 100 }))
                }
              >
                <SliderTrack>
                  <SliderFilledTrack bg="orange.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>

            {/* Slider 4: Revision Outcome */}
            <VStack align="stretch" spacing={1}>
              <HStack justify="space-between">
                <Text fontSize="xs" fontWeight="bold">
                  Previous Revision Outcome
                </Text>
                <Badge colorScheme="red">{pct(weights.weightRevisionOutcome)}%</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Problems where past revision needed hints or failed get boosted.
              </Text>
              <Slider
                aria-label="revision-outcome-weight"
                value={weights.weightRevisionOutcome * 100}
                min={5}
                max={60}
                step={5}
                onChange={(val) =>
                  setWeights((prev) => ({ ...prev, weightRevisionOutcome: val / 100 }))
                }
              >
                <SliderTrack>
                  <SliderFilledTrack bg="red.400" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr="auto" size="xs" onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button variant="ghost" mr={2} size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" size="sm" onClick={handleSave} isLoading={isSaving}>
            Save Weights
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
