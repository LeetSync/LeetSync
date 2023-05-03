import {
  useEditableControls,
  ButtonGroup,
  IconButton,
  Flex,
  Editable,
  EditablePreview,
  Input,
  EditableInput,
  EditableProps,
  InputProps,
} from '@chakra-ui/react';
import React from 'react';
import { BiCheck, BiEditAlt, BiX } from 'react-icons/bi';

interface CustomEditableProps {
  defaultValue: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onCancel?: () => void;
  props?: EditableProps;
  inputProps?: InputProps;
}
export const CustomEditableComponent: React.FC<CustomEditableProps> = ({
  defaultValue,
  value,
  props,
  onChange,
  onSubmit,
  inputProps,
}) => {
  /* Here's a custom control */
  function EditableControls() {
    const {
      isEditing,
      getSubmitButtonProps,
      getCancelButtonProps,
      getEditButtonProps,
    } = useEditableControls();

    return isEditing ? (
      <ButtonGroup justifyContent='center' size='sm' alignSelf='center'>
        <IconButton
          aria-label='check'
          icon={<BiCheck />}
          {...getSubmitButtonProps()}
        />
        <IconButton
          aria-label='close'
          icon={<BiX />}
          {...getCancelButtonProps()}
        />
      </ButtonGroup>
    ) : (
      <Flex justifyContent='center' alignSelf='center'>
        <IconButton
          aria-label='edit'
          size='sm'
          icon={<BiEditAlt />}
          {...getEditButtonProps()}
        />
      </Flex>
    );
  }

  return (
    <Editable
      textAlign='center'
      defaultValue={defaultValue || value || ''}
      fontSize='2xl'
      isPreviewFocusable={false}
      value={value}
      display='flex'
      width='100%'
      align='center'
      justify='center'
      onChange={onChange}
      onSubmit={() => onSubmit && onSubmit()}
      {...props}
    >
      <EditablePreview w='100%' />
      {/* Here is the custom input */}
      <Input as={EditableInput} {...inputProps} />
      <EditableControls />
    </Editable>
  );
};
