import * as React from 'react';

import { Alert, Button, Col, Container, FloatingLabel, Form, Modal, Row, Stack } from 'react-bootstrap';

import VotingContainer from '../components/VotingContainer';
import { useLocation } from 'wouter';

interface VotingViewProps {
  item: GroupRecommendation;
  update: () => void;
}

const Votingview = ({ item, update }: VotingViewProps) => {
  const [, setLocation] = useLocation();
  const [modalDelete, setModalDelete] = React.useState<UserVote | undefined>(undefined);
  const [modalEdit, setModalEdit] = React.useState<UserVote | undefined>(undefined);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const endVoting = async () => {
    const response = await fetch(`/recommendation?id=${item.id}&full=0`, { method: 'PUT' });
    if (!response.ok) {
      console.log(response);
      setLocation('/error');
    }
    update();
  };

  return (
    <div>
      <Container fluid>
        <Row>
          <Col md={9}>
            <h1>Group Recommendation #{item.sessionCode}</h1>
            <p>Here you can see votes from others, vote yourself or end the voting phase when you are ready</p>
          </Col>
          <Col md={3} className='ms-auto d-flex flex-column align-items-center'>
            <img src={item.qrcode} alt='alt' />
            <h5 className='mt-2'>Share with your friends!</h5>
          </Col>
        </Row>
      </Container>
      <hr className='mt-3' />
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
        <Button size='lg' variant='warning' onClick={() => endVoting()}>
          End voting phase & see results
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
        update={update}
      />
      <DeleteConfirmationModal
        item={modalDelete}
        show={Boolean(modalDelete)}
        onHide={() => {
          setModalDelete(undefined);
        }}
        update={update}
      />
    </div>
  );
};
export default Votingview;

interface DeleteConfirmationModalProps {
  item?: UserVote;
  show: boolean;
  onHide: () => void;
  update: () => void;
}

const DeleteConfirmationModal = ({ item, onHide, update, ...rest }: DeleteConfirmationModalProps) => {
  const handleDelete = () => {
    fetch(`/userVote?id=${item!.id}`, { method: 'DELETE' }).then(() => {
      onHide();
      update();
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
  update: () => void;
}

const CreateEditModal = ({ item, parentId, onHide, update, ...rest }: CreateEditModalProps) => {
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
        update();
      });
    } else {
      fetch('/userVote', {
        method: 'POST',
        body: JSON.stringify(value),
        headers: { 'Content-Type': 'application/json' },
      }).then(() => {
        onHide();
        update();
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
