import * as React from 'react';

import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  FloatingLabel,
  Form,
  Modal,
  OverlayTrigger,
  Row,
  Stack,
  Toast,
  ToastContainer,
  Tooltip,
} from 'react-bootstrap';
import { BiCopy, BiInfoCircle } from 'react-icons/bi';
import { FaArrowRightLong } from 'react-icons/fa6';
import { useLocation } from 'wouter';

import VotingContainer from '../components/VotingContainer';

interface VotingViewProps {
  item: GroupRecommendation;
  update: () => void;
}

const Votingview = ({ item, update }: VotingViewProps) => {
  const [, setLocation] = useLocation();
  const [modalDelete, setModalDelete] = React.useState<UserVote | undefined>(undefined);
  const [modalEdit, setModalEdit] = React.useState<UserVote | undefined>(undefined);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [stayDays, setStayDays] = React.useState(item.stayDays);
  const [description, setDescription] = React.useState(item.description);
  const [showToast, setShowToast] = React.useState(false);

  const endVoting = async () => {
    const response = await fetch(`/recommendation?id=${item.id}&full=0`, { method: 'PUT' });
    if (!response.ok) {
      console.log(response);
      setLocation('/error');
    }
    update();
  };

  const handleSaveSettings = async () => {
    const body = { stayDays, description };
    const response = await fetch(`/recommendationValues?id=${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.log(response);
      setLocation('/error');
    } else {
      setShowToast(true);
    }
  };

  return (
    <div>
      <Container fluid>
        <Row>
          <Col md={9}>
            <h1>Group Recommendation #{item.sessionCode}</h1>
            <p>Here you can adjust settings, vote, or end the voting phase when you are ready</p>
            <Card body>
              <h5>Settings</h5>
              <Stack direction='horizontal' gap={4}>
                <FloatingLabel label='Total number of days for your trip' className='mb-3'>
                  <Form.Control
                    value={stayDays}
                    onChange={(e) => setStayDays(Number(e.target.value))}
                    placeholder='Total number of days for your trip'
                    type='number'
                    style={{ width: 250 }}
                    id='stayDayInput'
                  />
                </FloatingLabel>
                <FloatingLabel label='Description' className='mb-3'>
                  <Form.Control
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Description'
                    style={{ width: 500 }}
                    id='descriptionInput'
                  />
                </FloatingLabel>
              </Stack>
              <Button onClick={handleSaveSettings}>Save settings</Button>
            </Card>
          </Col>
          <Col md={3} className='ms-auto d-flex flex-column align-items-center'>
            <img src={item.qrcode} alt='alt' />
            <h5 className='mt-2'>Share with your friends!</h5>
            <Stack direction='horizontal' gap={2} style={{ alignSelf: 'revert' }}>
              <Button
                variant='outline-light'
                onClick={() => navigator.clipboard.writeText(`https://group-travel.fly.dev/session/${item.id}`)}
              >
                Copy Link <BiCopy />
              </Button>
              <Button variant='outline-light' onClick={() => navigator.clipboard.writeText(item.sessionCode)}>
                Copy Session Id <BiCopy />
              </Button>
            </Stack>
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
          + Add new user
        </Button>
        <Button size='lg' variant='warning' onClick={() => endVoting()}>
          End voting phase & see recommendations <FaArrowRightLong />
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
      <ToastContainer className='p-3' position='bottom-start' style={{ zIndex: 1 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg='success'>
          <Toast.Header>
            <strong className='me-auto'>Settings</strong>
          </Toast.Header>
          <Toast.Body>Settings saved</Toast.Body>
        </Toast>
      </ToastContainer>
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
  budget: 500,
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
    <Modal onHide={onHide} {...rest} size='lg' aria-labelledby='contained-modal-title-vcenter' backdrop='static' centered>
      <Modal.Header closeButton>
        <Modal.Title id='contained-modal-title-vcenter'>Edit Vote</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Stack gap={4}>
          <FloatingLabel label='Enter your name'>
            <Form.Control
              id='nameInput'
              value={value.name}
              onChange={(e) => setValue((old) => ({ ...old, name: e.target.value }))}
              className='me-auto'
              placeholder='Enter your name...'
            />
          </FloatingLabel>
          <Form.Group className='mb-3'>
            <Form.Label>
              Maximum Living Costs Budget in €{' '}
              <OverlayTrigger
                placement='bottom'
                overlay={
                  <Tooltip>
                    The maximum amount of money you are willing to spend on <strong>living costs</strong> such as hotel fees and food for
                    the <i>whole trip</i>.<br />
                    This number <i>can</i> be used to exclude destinations costing more at a later stage. If a destination is cheaper than
                    this budget, however, is <strong>always</strong> taken into account.
                  </Tooltip>
                }
              >
                <span>
                  <BiInfoCircle />
                </span>
              </OverlayTrigger>
            </Form.Label>
            <Form.Control
              value={value.budget}
              onChange={(e) => setValue((old) => ({ ...old, budget: Number(e.target.value) }))}
              placeholder='Maximum Living Costs Budget'
              type='number'
              style={{ maxWidth: 300 }}
              id='budgetInput'
            />
          </Form.Group>
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
