import { Container, Button, Badge, Nav, ProgressBar, Table, Image, Modal, Form, Spinner, Tab } from 'react-bootstrap';
import styles from './Account.module.css'
import { useCookies } from 'react-cookie';
import { useEffect, useRef, useState } from 'react';

import Header from '../../components/Header'
import Footer from '../../components/Footer'

import API from '../../utils/API'
import Link from 'next/link';

const Account = (props) => {
    const [showEdit, setEditModal] = useState(false);
    const [posts, setPosts] = useState([]);
    const [active, setActive] = useState([]);
    const [noactive, setNoActive] = useState([]);
    const [block, setBlock] = useState([]);

    const [deleteId, setDeleteId] = useState();
    const [confirm, setConfirm] = useState();

    const editButton = useRef()

    const email = useRef()
    const phone = useRef()
    const avatar = useRef()

    const [cookies, setCookies, removeCookies] = useCookies(["hash", "user_id"])

    const now = 30

    useEffect(async () => {
        var posts = await (await new API().GET("/api/posts/get_by_user", {author_id: cookies.user_id})).json()
        console.log(posts);
        if (posts.status) {
            console.log('posts', posts.response["posts"]);
            setPosts(posts.response["posts"])
            setActive(posts.response["posts"].filter(p => p.status === 1))
            setNoActive(posts.response["posts"].filter(p => p.status === 0))
            setBlock(posts.response["posts"].filter(p => p.status === 2))
        }
    }, [])

    const editUser = async e => {
        if (avatar.current.files[0] &&
            avatar.current.files[0].name.split('.')[1] != 'png' &&
            avatar.current.files[0].name.split('.')[1] != 'jpg' &&
            avatar.current.files[0].name.split('.')[1] != 'jpeg'
        ) {
            avatar.current.classList.add('red')
            return
        }
        else if (!email.current || email.current.value.length < 6) {
            email.current.classList.add('red')
            return
        }
        // else if (!phone.current || phone.current.value.length < 6) {
        //     phone.current.classList.add('red')
        //     return
        // }
        else {
            email.current.classList.remove('red')
            //phone.current.classList.remove('red')
            avatar.current.classList.remove('red')
        }

        // var phone_data = phone.current.value ? phone.current.value : null
        var email_data = email.current.value ? email.current.value : null
        var avatar_data = avatar.current.files[0] ? avatar.current.files[0] : null

        let query = {auth_token: cookies.hash, user_id: cookies.user_id, user_email: email_data} //user_phone: phone_data,
        const userData = await (await new API().addFile("/api/users/edit", avatar_data, query)).json()
        if (userData.status) {
            //props.user.user_phone = phone_data.split('+')[1]
            props.user.user_email = email_data
            if (avatar_data) props.user.user_image = userData.response.url
            setEditModal(false)
            props.showPopup('Настройки', 'Профиль успешно отредактирован')
        }
        else {
            editButton.current.value = "Профиль не отредактирован"
        }
    }

    const showConfirm = e => {
        const id = Number(e.currentTarget.dataset.id)
        setDeleteId(id)
    }

    const deletePost = async e => {
        setTimeout(() => setPosts(posts.filter(post => post.post_id !== deleteId)), 500)
        var id = deleteId
        setDeleteId(false)
        setConfirm(false)
        await (await new API().GET("/api/posts/remove", {auth_token: cookies.hash, post_id: id, user_id: cookies.user_id})).json()
    }

    const updatePost = async e => {
        let id = Number(e.target.dataset.id)
        console.log('id ', id);
        const update = await (await new API().GET("/api/posts/update", {auth_token: cookies.hash, post_id: id, author_id: cookies.user_id})).json()
        if (update.status) props.showPopup("Поднятие", "Объявление успешно поднято")
        else if (update.error === "time") props.showPopup("Поднятие", "Объявление поднимать можно лишь раз в час")
        else props.showPopup("Поднятие", "Ошибка. Объявление не было поднято")
    }

    const EditModal = props => (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Редактировать профиль
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
            <Form.Group controlId="formBasicEmail">
                <Form.Label>Почта</Form.Label>
                <Form.Control type="email" placeholder="Введите свою почту" ref={email} defaultValue={props.user && props.user.user_email}/>
                <Form.Text className="text-muted">
                Почта используется для отправки уведомлений об объявлениях
                </Form.Text>
            </Form.Group>

            {/* <Form.Group controlId="formBasicPassword">
                <Form.Label>Номер телефона</Form.Label>
                <Form.Control type="text" defaultValue={props.user && '+'+props.user.user_phone} ref={phone} placeholder="Введите свой номер телефона" />
            </Form.Group> */}

            <Form.Group>
                <Form.File id="exampleFormControlFile1" accept="image/*" ref={avatar} label="Изменить фото профиля" />
            </Form.Group>

            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={editUser} variant="primary" ref={editButton}>
                Редактировать
            </Button>
        </Modal.Footer>
      </Modal>
    )

    const ConfirmDelete = props => (
        <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Удаление объявления
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
         Вы хотите удалить объявление?
        </Modal.Body>
        <Modal.Footer>
            <Button onClick={() => deletePost()} variant="primary">
                Подтвердить
            </Button>
        </Modal.Footer>
      </Modal>
    )

    const Post = ({post}) => (
        <tr>
            <td>
                <div className={styles.rowbuttons}>
                    <Link href={`/account/edit/${post.post_id}`}>
                        <Button className={styles.buttons} data-id={post.post_id} variant="primary"><i class="fa fa-pencil" aria-hidden="true"></i></Button>
                    </Link>
                    <Link href={(post.status === 1) ? `/posts/${post.post_id}` : `/posts/${post.post_id}?user_id=${props.user.user_id}`}>
                        <Button className={styles.buttons} data-id={post.post_id} variant="warning"><i class="fa fa-eye" aria-hidden="true"></i></Button>
                    </Link>
                    <Button className={styles.buttons} data-id={post.post_id} onClick={showConfirm} variant="danger"><i class="fa fa-ban" aria-hidden="true"></i></Button>
                </div>
            </td>  
            <td>{post.post_name}</td>
            <td><div className={styles.time}>
                { (Date.now() - post.timestamp) > 3600*1000
                ? <Button data-id={post.post_id} onClick={updatePost} variant="success">Поднять объявление</Button>
                : <ProgressBar now={Math.round(((Date.now() - post.timestamp)/1000)/60)} label={`${Math.round((3600-(Date.now() - post.timestamp)/1000)/60)}мин.`} />
                }
            </div></td>
            {/* <ProgressBar now={now} label={`${now}мин.`} /> */}
            {!post.status && <td><span className={styles.statusfalse}>{"На модерации"}</span></td> }
            {(post.status === 1) && <td><span className={styles.statustrue}>{"Активен"}</span></td> }
            {(post.status === 2) && <td><span className={styles.statusblock}>{"Отклонен"}</span></td> } 
        </tr>
    )

    return (
        (props.user && posts) ?
            <>
                <Header user={props.user} back={true} logoutAction={props.logoutAction} />
                <section id="welcome">
                    <div className={styles.welcome}>
                        <Container>
                            <div className={styles.welcomebox}>
                                <span className={styles.image} style={{background:`url('${new API().Link}/${props.user && props.user.user_image}')`, backgroundSize:'cover', backgroundPosition:'center'}} roundedCircle ></span>
                                <div className={styles.content}>
                                    <span className={styles.name}>Добро пожаловать, <b>{props.user && props.user.user_name}</b>!</span>
                                    <Button className={styles.editbut} variant="outline-success" onClick={() => setEditModal(true)}>Редактировать профиль</Button>
                                    <Button className={styles.editbut} variant="outline-secondary" onClick={props.logoutAction}>Выйти</Button>
                                </div>
                            </div>
                        </Container>
                    </div>
                </section>
                <section id="items">
                    <Container>
                        <div className={styles.header}>
                            <span className="name">Мои Объявления <Badge className={styles.count} variant="success">{posts.length}</Badge></span>
                            <Link href="/account/add"><Button variant="success">Добавить объявление</Button></Link>
                        </div>
                        <Tab.Container id="left-tabs-example" defaultActiveKey="/home">
                            <div className={styles["card-list"]}>
                                <Nav variant="tabs">
                                <Nav.Item>
                                    <Nav.Link eventKey="/home">
                                        Все
                                        <Badge variant="link">{posts.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="/active">
                                        Активные
                                    <Badge variant="link">{active.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="/noactive">
                                        На модерации
                                    <Badge variant="link">{noactive.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="/block">
                                        Отклоненные
                                    <Badge variant="link">{block.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                                </Nav>
                            </div>
                            <Tab.Content>
                                    <Tab.Pane eventKey="/home">
                                                <>
                                                <Table responsive bordered hover>
                                                    <thead>
                                                        <tr>
                                                            <th>Действия</th>
                                                            <th>Название</th>
                                                            <th>Поднять объявление</th>
                                                            <th>Статус объявления</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {posts && posts.map(post => <Post post={post} />)}
                                                    </tbody>
                                                    </Table>
                                                </>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="/active">
                                                <>
                                                <Table responsive bordered hover>
                                                    <thead>
                                                        <tr>
                                                            <th>Действия</th>
                                                            <th>Название</th>
                                                            <th>Поднять объявление</th>
                                                            <th>Статус объявления</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {active && active.map(post => <Post post={post} />)}
                                                    </tbody>
                                                    </Table>
                                                </>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="/noactive">
                                                <>
                                                <Table responsive bordered hover>
                                                    <thead>
                                                        <tr>
                                                            <th>Действия</th>
                                                            <th>Название</th>
                                                            <th>Поднять объявление</th>
                                                            <th>Статус объявления</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {noactive && noactive.map(post => <Post post={post} />)}
                                                    </tbody>
                                                    </Table>
                                                </>
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="/block">
                                                <>
                                                <Table responsive bordered hover>
                                                    <thead>
                                                        <tr>
                                                            <th>Действия</th>
                                                            <th>Название</th>
                                                            <th>Поднять объявление</th>
                                                            <th>Статус объявления</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {block && block.map(post => <Post post={post} />)}
                                                    </tbody>
                                                    </Table>
                                                </>
                                    </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
                        {/* <div className={styles.items}>
                            <div className={styles.item}>
                                <span className={styles.image}></span>
                                <ProgressBar now={now} label={`${now}мин.`} />
                            </div>
                        </div> */}
                    </Container>
                </section>
                <ConfirmDelete
                    show={deleteId ? true : false}
                    onHide={() => setDeleteId(false)}
                />
                <EditModal
                    user={props.user}
                    show={showEdit}
                    onHide={() => setEditModal(false)}
                />
                <Footer user={props.user} />
            </>
        :  <Spinner className="spinner" animation="grow" variant="success" />
    )
}

export default Account