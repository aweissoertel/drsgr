import * as React from 'react';

import { Alert, Button, FloatingLabel, Form, Modal, Stack } from 'react-bootstrap';

import VotingContainer from '../components/VotingContainer';

const Votingview = ({ item }: { item: GroupRecommendation }) => {
  const [modalDelete, setModalDelete] = React.useState<UserVote | undefined>(undefined);
  const [modalEdit, setModalEdit] = React.useState<UserVote | undefined>(undefined);
  const [showEditModal, setShowEditModal] = React.useState(false);

  return (
    <div>
      <h1>Group Recommendation #{item.sessionCode}</h1>
      <p>Here you can see Votes from others, vote yourself or end the voting phase when you are ready</p>
      <hr className='mt-5' />
      <Stack gap={1} className='mt-5'>
        {item.userVotes?.map((vote) => (
          <Alert key={vote.id} variant='light'>
            <div className='d-flex gap-3 justify-content-end align-items-center'>
              <Alert.Heading style={{ marginRight: 'auto', marginBottom: 0 }}>{vote.name}</Alert.Heading>
              <Button
                onClick={() => {
                  setModalEdit(vote);
                  setShowEditModal(true);
                }}
                variant='outline-warning'
              >
                Edit
              </Button>
              <Button onClick={() => setModalDelete(vote)} variant='outline-danger'>
                Delete
              </Button>
            </div>
          </Alert>
        ))}
        <Button size='lg' variant='success' onClick={() => setShowEditModal(true)}>
          + Create new vote
        </Button>
      </Stack>
      <CreateEditModal
        parentId={item.id}
        item={modalEdit}
        show={showEditModal}
        onHide={() => {
          setModalEdit(undefined);
          setShowEditModal(false);
        }}
      />
      <DeleteConfirmationModal
        item={modalDelete}
        show={Boolean(modalDelete)}
        onHide={() => {
          setModalDelete(undefined);
        }}
      />
    </div>
  );
};
export default Votingview;

interface DeleteConfirmationModalProps {
  item?: UserVote;
  show: boolean;
  onHide: () => void;
}

const DeleteConfirmationModal = ({ item, onHide, ...rest }: DeleteConfirmationModalProps) => {
  const handleDelete = () => {
    fetch(`/userVote?id=${item!.id}`, { method: 'DELETE' }).then(() => {
      onHide;
      location.reload();
    });
  };

  return (
    <Modal onHide={onHide} {...rest} size='lg' aria-labelledby='contained-modal-title-vcenter' centered>
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>Delete {item?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete the Voting of {item?.name}?
          <br />
          <strong>This action is irreversible</strong>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide} variant='outline-secondary'>
          Cancel
        </Button>
        <Button onClick={() => handleDelete()} variant='danger' disabled={!item}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const emptyVote: UserVote = {
  id: '',
  name: '',
  preferences: {
    nature: 50,
    architecture: 50,
    hiking: 50,
    wintersports: 50,
    beach: 50,
    culture: 50,
    culinary: 50,
    entertainment: 50,
    shopping: 50,
  },
};

interface CreateEditModalProps {
  item?: UserVote;
  parentId: string;
  show: boolean;
  onHide: () => void;
}

const CreateEditModal = ({ item, parentId, onHide, ...rest }: CreateEditModalProps) => {
  const empty = { ...emptyVote, parentId };
  const [value, setValue] = React.useState<UserVote>(item ?? empty);
  const [lock, setLock] = React.useState(false);
  React.useEffect(() => {
    empty.parentId = parentId;
    setValue(item ?? empty);
    setLock(false);
  }, [rest.show]);

  const handleUpdate = () => {
    setLock(true);
    if (item) {
      fetch(`/userVote?id=${item!.id}`, {
        method: 'PUT',
        body: JSON.stringify(value),
        headers: { 'Content-Type': 'application/json' },
      }).then(() => {
        onHide();
        location.reload();
      });
    } else {
      fetch('/userVote', {
        method: 'POST',
        body: JSON.stringify(value),
        headers: { 'Content-Type': 'application/json' },
      }).then(() => {
        onHide();
        location.reload();
      });
    }
  };

  return (
    <Modal onHide={onHide} {...rest} size='lg' aria-labelledby='contained-modal-title-vcenter' centered>
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>Edit Vote</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack gap={4}>
          <FloatingLabel controlId='floatingInput' label='Enter your name' className='mb-3'>
            <Form.Control
              value={value.name}
              onChange={(e) => setValue((old) => ({ ...old, name: e.target.value }))}
              className='me-auto'
              placeholder='Enter your name...'
            />
          </FloatingLabel>
          <VotingContainer userData={value} setUserData={setValue} />
        </Stack>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='outline-secondary' onClick={onHide}>
          Cancel
        </Button>
        <Button variant='success' onClick={() => handleUpdate()} disabled={lock}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
