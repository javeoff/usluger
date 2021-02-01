import Header from '../../components/Header'
import styles from './Admin.module.css'

import API from '../../utils/API'
import { useCookies } from 'react-cookie';
import {useRouter} from 'next/router'

import { Container, Button, Spinner, Table, Nav, Tab, Badge } from 'react-bootstrap';
import { useEffect, useState } from 'react';

export default function Admin(props) {
    const [cookies, setCookies, removeCookies] = useCookies(["hash", "user_id"])

    const [mposts, setMposts] = useState()
    const [oposts, setOposts] = useState()
    const [dposts, setDposts] = useState()

    const [mmustFetch, msetMustFetch] = useState(false)
    const [moffset, msetOffset] = useState(0)

    const mloadOnScroll = e => {
        if (mposts && mposts.length > 0) {
            var el = document.getElementById("mend") //String(posts[posts.length-5]["post_id"])
            var rect = el.getBoundingClientRect();
            var isEnd = (
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            )
    
            if (isEnd) {
                msetMustFetch(true)
            }
        }
    }

    useEffect(() => {
        if (mposts && mposts.length > 0) {
            window.addEventListener('scroll', mloadOnScroll);
        }
    }, [])

    useEffect(async () => {
        if (mposts && mposts.length > 0 && mmustFetch === true) {
            if (mposts[mposts.length-1] !== "end") {
                const mpostsData = (await (await new API().GET("/api/admin/mposts", {auth_token: cookies.hash, user_id: cookies.user_id, offset: moffset})).json())
                let postsArr = mpostsData.status === 1 ? mpostsData.response.posts : ['end']
                msetOffset(prev => prev + 3)
                setMposts([...mposts, ...postsArr])
            }
            else {
                props.showPopup("Объявления на проверку","Вы проверили все объявления")
            }
            msetMustFetch()
        }
    }, [mmustFetch])

    const router = useRouter()

    useEffect(async () => {
        if (!mposts) {
            const mpostsData = (await (await new API().GET("/api/admin/mposts", {auth_token: cookies.hash, user_id: cookies.user_id})).json())
            setMposts(mpostsData.status === 1 ? mpostsData.response.posts : [])
        }
    
        if (!oposts) {
            const opostsData = (await (await new API().GET("/api/admin/oposts", {auth_token: cookies.hash, user_id: cookies.user_id})).json())
            setOposts(opostsData.status === 1 ? opostsData.response.posts : [])
        }
    
        if (!dposts) {
            const dpostsData = (await (await new API().GET("/api/admin/dposts", {auth_token: cookies.hash, user_id: cookies.user_id})).json())
            console.log(dpostsData);
            setDposts(dpostsData.status === 1 ? dpostsData.response.posts : [])
        }

    }, [mposts, oposts, dposts])

    const formPost = async (e, status, post_status) => {
        const data = (await (await new API().GET("/api/admin/formpost", {
            auth_token: cookies.hash, 
            user_id: cookies.user_id, 
            post_id: Number(e.target.dataset.id),
            status
        })).json())

        var status_text = status === 1 ? "Одобренные" : "Отклоненные"

        if (data.status) props.showPopup("Администрация", "Статус объявления изменен на "+ status_text)
        else props.showPopup("Ошибка", "Ошибка со стороны сервера: "+ data.response)

        console.log('poststat ',post_status, status);

        if (post_status === 0) setMposts(mposts.filter(p => {
            if (p.post_id !== Number(e.target.dataset.id)) return p
            else {
                if (status === 0) setMposts([p, ...mposts])
                if (status === 1) setOposts([p, ...oposts])
                if (status === 2) setDposts([p, ...dposts])
            }
        }))
        if (post_status === 1) setOposts(oposts.filter(p => {
            if (p.post_id !== Number(e.target.dataset.id)) return p
            else {
                if (status === 0) setMposts([p, ...mposts])
                if (status === 1) setOposts([p, ...oposts])
                if (status === 2) setDposts([p, ...dposts])
            }
        }))
        if (post_status === 2) setDposts(dposts.filter(p => {
            if (p.post_id !== Number(e.target.dataset.id)) return p
            else {
                if (status === 0) setMposts([p, ...mposts])
                if (status === 1) setOposts([p, ...oposts])
                if (status === 2) setDposts([p, ...dposts])
            }
        }))

    }

    const ItemPost = ({post, styles}) => (
        (post === "end") ? <h4>Объявлений в данной категории больше нет</h4> :<>
        <div className={styles.item}>
        <div className={styles.hinfo}>
            <span>({post.city_name}) </span>
            <span className={styles.category}>{post.category_path}</span>
        </div>
        <span className={styles.name}>{post.post_name}</span>
        <div className={styles.description}>{post.post_description}</div>
        <div className={styles.images}>
            <img className={styles.image} src={post.image1 ? `${new API().Link}/${post.image1}` : null} />
            <img className={styles.image} src={post.image2 ? `${new API().Link}/${post.image2}` : null} />
            <img className={styles.image} src={post.image3 ? `${new API().Link}/${post.image3}` : null} />
            <div className={styles.author}>
                <span className={styles.aimg} style={{background:`url('${new API().Link}/${post.author_image}')`, backgroundSize:'cover', backgroundPosition:'center'}}></span>
                <div className={styles.info}>
                    <span className={styles.aname}>{post.author_name}</span>
                    <a className={styles.phone}>Показать номер</a>
                </div>
            </div>
        </div>
        <Table className={styles.table} responsive="sm" size="sm">
            <thead>
            <tr>
                <th>#</th>
                <th>Вид услуги</th>
                <th>Стоимость</th>
            </tr>
            </thead>
            <tbody>
                {[post.item_table1, post.item_table2, post.item_table3, post.item_table4].map(item => (
                <tr>
                    <td>{item.split(" ")[0]}</td>
                    <td>{item.split(" ")[1]}</td>
                    <td>{item.split(" ")[2]}</td>
                </tr>
                ))}
            </tbody>
        </Table>
        <div className={styles.buttons}>
                <Button variant="outline-success" data-id={post.post_id} onClick={e => formPost(e, 1, post.status)} >Опубликовать</Button>
                <Button variant="outline-danger" data-id={post.post_id} onClick={e => formPost(e, 2, post.status)} >Отклонить</Button>
        </div>
        </div>
        </>
    )

    return (
        (props.user && props.user.admin === 1) ?
        <>
            <Header top={false} user={props.user} logoutAction={props.logoutAction} />
            <section id="adminPosts">
                <Container>
                    <Tab.Container id="left-tabs-example" defaultActiveKey="/home">
                        <div className={styles.boxadd}>
                            <h2>Админ Панель</h2>
                            <Nav variant="tabs">
                                <Nav.Item>
                                    <Nav.Link eventKey="/home">
                                        На модерации
                                    {/* <Badge variant="link">{mposts && mposts.length}</Badge> */}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="/active">
                                        Одобренные
                                        {/* <Badge variant="link">{oposts && oposts.length}</Badge> */}
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="/noactive">
                                        Отклоненные
                                        {/* <Badge variant="link">{dposts && dposts.length}</Badge> */}
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <Tab.Content>
                                <Tab.Pane eventKey="/home">
                                    {mposts ? mposts.map(post => (<ItemPost post={post} styles={styles} />)) : null }
                                    {(mposts && mposts.length === 0) && <h3 className={styles.notfound}>Хорошая работа! Объявления закончились</h3>}
                                    <div id="mend"></div>
                                </Tab.Pane>
                                <Tab.Pane eventKey="/active">
                                    {oposts ? oposts.map(post => (<ItemPost post={post} styles={styles} />)) : null }
                                    {(oposts && oposts.length === 0) && <h3 className={styles.notfound}>Активные объявления не найдены</h3>}
                                </Tab.Pane>
                                <Tab.Pane eventKey="/noactive">
                                    {dposts ? dposts.map(post => (<ItemPost post={post} styles={styles} />)) : null }
                                    {(dposts && dposts.length === 0) && <h3 className={styles.notfound}>Отклоненные объявления не найдены</h3>}
                                </Tab.Pane>
                            </Tab.Content>
                        </div>
                    </Tab.Container>
                </Container>
            </section>
        </> 
        : 
        <Spinner className="spinner" animation="grow" variant="success" />
    )
}