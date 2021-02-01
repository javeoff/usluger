import Link from 'next/link'
import Head from 'next/head'
import { Button, DropdownButton, Dropdown, Container, Row, Col, Form, Alert, Modal } from 'react-bootstrap';

import Header from '../../components/Header'
import Footer from '../../components/Footer'

import sklonyator from 'sklonyator';

import {useRouter} from 'next/router'
import API from '../../utils/API'
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react';

const MyVerticallyCenteredModal = (props) => (
    <Modal
    {...props}
    size="lg"
    aria-labelledby="contained-modal-title-vcenter"
    centered
  >
    <Modal.Header closeButton>
      <Modal.Title id="contained-modal-title-vcenter">
        Выбор города
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <ul >
            {props.cities_parent.map(city => (
                <li>
                    <Link 
                    href={{
                        pathname: '/cities/[name]',
                        query: { name: city.city_query, category_id: props.category.category_id },
                    }}
                    >{city.city_name}</Link>
                </li>
            ))}
        </ul>
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={props.onHide}>Закрыть</Button>
    </Modal.Footer>
  </Modal>
)

export default function Post(props) {
    const router = useRouter()
    const [modalShow, setModalShow] = useState(false);

    const [offset, setOffset] = useState(0)
    const [posts, setPosts] = useState(props.posts)
    const [mustFetch, setMustFetch] = useState(false)

    const loadOnScroll = e => {
        var el = document.getElementById("end")
        if (el) {
            var rect = el.getBoundingClientRect();
            var isEnd = (
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
            )
    
            if (isEnd) {
                setMustFetch(true)
            }
        }
    }

    useEffect(async () => {
        if (posts.length > 0 && mustFetch === true) {
            // FETCH ACTION
            if (posts[posts.length-1] !== "end") {
                var PostsData = await (await new API().GET("/api/posts", {city_id: props.city.city_id, offset})).json()
                var postsArr = PostsData.status ? PostsData.response.posts : ['end']
                setOffset(prev => prev + 12)
                setPosts([...posts, ...postsArr])
            }
            else {
                props.showPopup("Объявления","В данной категории больше нет объявлений")
            }

            setMustFetch(false)
        }
    }, [mustFetch])

    useEffect(() => {
        window.addEventListener('scroll', loadOnScroll);
    }, [])

    const show_phone = async e => {
        e.target.innerText = "Загрузка..."
        let id = e.target.dataset.id
        let data = await (await new API().GET("/api/posts/get_phone", {post_id: id})).json()
        let phone = data.status ? data.response.phone : "Ошибка запроса"
        console.log(phone);
        e.target.innerText = "+" + phone
    }
    

    return (
        <>
            <Head>
                {/* <link rel="shortcut icon" href="/favicon.ico"> */}
                <meta name="robots" content="noimageindex"></meta>
                <title>{props.category.category_name} {props.city.city_name} - Бесплатные объявления об услугах в {sklonyator.incline(props.city.city_name)} - Услугер - Доска объявлений услуг</title>
            </Head>
            <Header setPosts={setPosts} query={props.query} top={true} user={props.user} logoutAction={props.logoutAction} />
            <div id="navigation">
                <Container>
                    <Button onClick={() => router.back()} className="prev" variant="outline-secondary"><i className="fa fa-angle-left" aria-hidden="true"></i> Назад</Button>
                </Container>
            </div>
            {(props.categories && props.categories[0].length ? true : false) && 
                <section id="categories">
                    <div className="container">
                        <div className="list" style={props.categories.length >= 3 ? {justifyContent:"space-between"} : {justifyContent:"flex-start"}}>
                            { props.categories.map(row => (
                                <div className="column col-sm-3">
                                    {row.map(category => (
                                        <li>
                                            <Link href={'/cities/'+props.city.city_query+'?category_id='+category.id}>{category.name}</Link>
                                            {/* <span className="count">{category.count}</span> */}
                                        </li>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            }
            <section id="services">
                <Container>
                    <Row>
                    <Col sm={12} lg={8} className="order-sm-2 order-2 order-lg-1">
                        <div className="top">
                        <h1>{props.category.category_name} {props.city.city_name}</h1>
                        <DropdownButton id="dropdown-item-button" title="Фильтры">
                        {/* <Dropdown.ItemText>Dropdown item text</Dropdown.ItemText> */}
                        <Dropdown.Item as="button">По цене</Dropdown.Item>
                        <Dropdown.Item as="button">По дате публикации</Dropdown.Item>
                        <Dropdown.Item as="button">По репутации</Dropdown.Item>
                        </DropdownButton>
                        </div>
                        <div className="list">
                        {posts ? posts.map((post, i) => 
                        (post === "end") ? <h4>Объявлений в данной категории больше нет</h4> :<>
                            <div className="service" id={post.post_id}>
                                <div className="image-box">
                                    <span className="image" style={{background:`url('${new API().Link}/${post.image1}')`, backgroundSize:'cover', backgroundPosition:'center'}}></span>
                                </div>
                                <div className="content-box">
                                    <div className="header">
                                        <Link href={`/posts/${post.post_id}`}><span className="name a">{post.post_name}</span></Link>
                                        <span className="info">{post.city_name}</span>
                                        {/* <span className="info">{post.comment_count} отзывов</span> */}
                                    </div>
                                    <div className="desc"><span className="author">{post.author_name}:</span> {post.post_description}</div>
                                </div>
                                <div className="button-box">
                                    <Button variant="primary" onClick={show_phone} data-id={post.post_id}>Показать телефон</Button>
                                    <Link href={`/posts/${post.post_id}`}><Button variant="outline-dark">Подробнее <i className="fa fa-angle-right"></i></Button></Link>
                                </div>
                            </div>
                        </>
                        ) : 
                        <Alert variant="secondary">
                            Объявления отсутствуют<br />
                            <Alert.Link href={props.add_link && props.add_link}>Добавить объявление</Alert.Link>
                        </Alert>
                        }
                        <div id="end"></div>
                        </div>
                    </Col>
                    <Col sm={12} lg={4} className="order-sm-1 order-1 order-lg-2">  

                        { props.cities_parent && <>
                            <div className="service-card">
                                <Button variant="link" id="dropdown-city-button" onClick={() => setModalShow(true)}>
                                    Выбрать город
                                </Button>
                            </div>

                        <MyVerticallyCenteredModal
                            cities={props.cities}
                            cities_parent={props.cities_parent}
                            category={props.category}
                            show={modalShow}
                            onHide={() => setModalShow(false)}
                        />
                        </>}

                        {/* <div className="service-card">
                            <div className="price">
                                <Form>
                                <Form.Control type="text" placeholder="Цена от" disabled />
                                <Form.Control type="text" placeholder="до, руб." disabled />
                                </Form>
                            </div>
                            <Button variant="primary">Показать объявления</Button>
                        </div> */}
                        <div className="service-card service-popup">
                            <i className="icon fa fa-retweet"></i>
                            <div className="info">
                                <span className="name">Автоподнятия</span>
                                <span className="desc">За 100 руб./мес. ваше объявление автоматически будет подниматься в топ раз в час</span>
                            </div>
                        </div>
                    </Col>
                    </Row>
                </Container>
            </section>
            <Footer user={props.user} />
        </>
    )
}

export async function getServerSideProps(ctx) {
    const query = ctx.query
    var CitiesData = await (await new API().GET("/api/cities/find", {city_query: ctx.query.name})).json()
    var city = CitiesData.status && CitiesData.response.city
    var cities_parent = null
    
    if (city.city_type === 0) {
        var ParentData = await (await new API().GET("/api/cities/parent", {city_parent: city.city_id})).json()
        cities_parent = ParentData.status ? ParentData.response.cities : null

        if (cities_parent) {
            var PostsData = await (await new API().POST("/api/child_posts", {cities: cities_parent.map(c => c.city_id)})).json()
            var posts = PostsData.status && PostsData.response.posts
        }
        else posts = null
        // GET POSTS BY CHILDS
    }
    else {
        var PostsData = await (await new API().GET("/api/posts", {city_id: city.city_id})).json()
        var posts = PostsData.status && PostsData.response.posts
    }

    if (ctx.query.category_id) {
        var CategoryData = await (await new API().GET("/api/categories/get", {category_id: ctx.query.category_id})).json()
        var CategoriesData = await (await new API().GET("/api/categories/find", {parent_id: ctx.query.category_id})).json()
    }
    else {
        var CategoryData = {status: 1, response:{category_data:{category_name:"Услуги", category_id: "000", parent_id: "000"}}}
        var CategoriesData = await (await new API().GET("/api/categories")).json()
    }

    var category = CategoryData.status && CategoryData.response.category_data
    var categories = CategoriesData.status && CategoriesData.response.categories
    var lparentData = await (await new API().GET("/api/categories/get", {category_id: category.parent_id})).json()
    var lparent = lparentData.status && lparentData.response.category_data

    let params = {
        category_id: (category.category_id !== 0 && !category.category_id) ? category.category_id : "000",
        pcategory_id: (category.parent_id !== 0 && !category.parent_id) ? category.parent_id : "000",
        lcategory_id: (lparent.parent_id !== 0 && !lparent.parent_id) ? lparent.parent_id : "000",
        city_id: (city.city_id !== 0 && !city.city_id) ? city.city_id : "000",
        pcity_id: (city.city_parent !== 0 && !city.city_parent) ? city.city_parent : "000"
    }

    if (params.category_id === "000") {
        params.pcategory_id = "000"
        params.lcategory_id = "000"
    }
    else if (params.pcategory_id === "000") {
        params.pcategory_id = params.category_id
    }
    else if (params.lcategory_id === "000") {
        let save = params.pcategory_id
        params.pcategory_id = params.category_id
        params.category_id = save
    }
    else if (params.lcategory_id != "000") {
        let save = params.pcategory_id
        let save2 = params.category_id
        params.category_id = params.lcategory_id
        params.pcategory_id = save
        params.lcategory_id = save2
    }

    if (params.pcity_id != "000") {
        let save = params.pcity_id
        params.pcity_id = params.city_id
        params.city_id = save
    }

    console.log(city.city_parent);
    let add_link = "/account/add?"+new URLSearchParams(params).toString()

    return {props: {query, posts, city, categories, category, cities_parent, add_link}}
  }