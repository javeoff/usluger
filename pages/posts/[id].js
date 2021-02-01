import { Container, Row, Col, Carousel, Table, Button, Image, FormControl, Spinner, Modal, Breadcrumb } from 'react-bootstrap';

import Header from '../../components/Header'
import Footer from '../../components/Footer'

import API from '../../utils/API'
import { useEffect, useState } from 'react';
import styles from './Posts.module.css'

export default function Post(props) {
    const [hided, setHided] = useState(props.hided)
    const [images, setImages] = useState()

    const show_phone = async e => {
        e.target.innerText = "Загрузка..."
        setTimeout(() => {
            let phone = props.post.phone
            e.target.innerText = "+" + phone
        }, 500)
    }

    useEffect(() => {
        if (props.post) {
            let images_arr = []
            if (props.post.image1) images_arr.push(props.post.image1)
            if (props.post.image2) images_arr.push(props.post.image2)
            if (props.post.image3) images_arr.push(props.post.image3)
            setImages(images_arr)
        }
    }, [])

    return (
        props.post ?
        <>
            <Modal
            show={hided}
            onHide={() => setHided(!hided)}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                    Объявление скрыто
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h4>Это объявление доступно только Вам</h4>
                    <p>
                    Дождитесь модерации объявления, чтобы другие люди смогли увидеть его. Если статус объявления - <b>Отклонен</b>, попробуйте изменить содержание объявления, которое будет соответствовать правилам сервиса
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => setHided(!hided)}>Закрыть</Button>
                </Modal.Footer>
            </Modal>

            <Header top={true} user={props.user} logoutAction={props.logoutAction} />
            <div id="navigation">
                <Container>
                    <Button className="prev" variant="outline-secondary"><i class="fa fa-angle-left" aria-hidden="true"></i> Назад</Button>
                </Container>
            </div>
            <section id="item">
                <Container>
                    <Row>
                        <Col lg={5}>
                            <div className="preview-box">
                            <Carousel>
                                { images && images.map(image => (
                                    <Carousel.Item interval={5000}>
                                        <Image
                                        className="post-image"
                                        src={`${new API().Link}/${image}`}
                                        // style={{background:`url('${new API().Link}/${image}')`, backgroundSize:'cover', backgroundPosition:'center'}}
                                        alt="First slide"
                                        ></Image>
                                    </Carousel.Item>
                                ))}
                            </Carousel>
                            </div>
                        </Col>
                        <Col lg={7}>
                            <div className="content-box">
                                <Breadcrumb className={styles.brcrumb}>
                                <Breadcrumb.Item href={props.post.parent_link}>{props.post && props.post.city_parent}</Breadcrumb.Item>
                                <Breadcrumb.Item href={props.post.city_link}>
                                    {props.post && props.post.city_name}
                                </Breadcrumb.Item>
                                <Breadcrumb.Item active>{props.post && props.post.post_name}</Breadcrumb.Item>
                                </Breadcrumb>
                                <div className="header">
                                    <span className="name">{props.post && props.post.post_name}</span>
                                    <div className="info-box">
                                        <span className="info">{props.post && props.post.city_name}</span>
                                        {/* <span className="info">1000 отзывов</span> */}
                                    </div>
                                </div>

                                <span className="description">
                                    {props.post.post_description}
                                </span>

                                <div className="buttons">
                                <Button variant="primary" onClick={show_phone}>Показать телефон</Button>
                                <Button variant="light">Написать SMS</Button>
                                <Button variant="light">Позвонить</Button>
                                <Button className="icon" variant="success"><i className="fa fa-whatsapp" aria-hidden="true"></i></Button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
            <section id="price">
                <Container>
                    <Row>
                        <Col sm={12} lg={8}>
                            <Table responsive="sm">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Вид услуги</th>
                                    <th>Стоимость</th>
                                </tr>
                                </thead>
                                <tbody>
                                { [props.post.item_table1, props.post.item_table2, props.post.item_table3].map((item, i) => (
                                    <tr>
                                        {[i, item.split(' ')[0], `${item.split(' ')[1]} ${item.split(' ')[2]}`].map(list => (
                                            <td>{list}</td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        </Col>
                        <Col className="author-box">
                            <div className="author">
                                <div className="header">
                                    <div className="image" 
                                    style={{background:`url('${new API().Link}/${props.post.user_image}')`, backgroundSize:'cover', backgroundPosition:'center'}}
                                    roundedCircle></div>
                                    <div className="info">
                                        <span className="name">Владимир Путин</span>
                                        <Button className="phone" onClick={show_phone} variant="link">Показать телефон</Button>
                                    </div>
                                </div>
                            </div>
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
            <hr />
            {/* <section id="feedback">
                <Container>
                    <div className="header">
                        <span className="name">Отзывы</span>
                        <span className="count">11</span>
                    </div>
                    <Row className="feedback-box">
                        <Col >
                            <FormControl
                                placeholder="Напишите отзыв"
                                aria-label="Напишите отзыв"
                                aria-describedby="basic-addon2"
                            />
                        </Col>
                        <Col sm={12} lg={4}>
                        <Button className="send" variant="success">Отправить</Button>
                        </Col>
                    </Row>
                    <div className="comments">
                        <div className="comment">
                            <div className="header">
                                <span className="author">Дмитрий Медведев</span>
                                <span className="date"> 15 минут назад</span>
                            </div>
                            <span className="content">Сделали все быстро и качественно, рекомендую Сделали все быстро и качественно, рекомендую Сделали все быстро и качественно, очень доволен работаой</span>
                        </div>
                        <div className="comment">
                            <div className="header">
                                <span className="author">Александр Пушкин</span>
                                <span className="date">2 часа назад</span>
                            </div>
                            <span className="content">Сделали все  качественно, рекомендую Сделали все быстро и качественно, очень доволен работаой  качественно, рекомендую Сделали все быстро и качественно, очень доволен работаой</span>
                        </div>
                    </div>
                </Container>
            </section> */}
            <Footer user={props.user} />
        </>
        : <Spinner className="spinner" animation="grow" variant="success" />
    )
}

export async function getServerSideProps(ctx) {
    var hided = false

    if (ctx.query.id && ctx.query.user_id) {
        var PostData = await (await new API().GET("/api/posts/get", {post_id: ctx.query.id, user_id: ctx.query.user_id})).json()
        var post = PostData.status === 1 ? PostData.response.post_data : null
        hided = true
    }
    else if (ctx.query.id) {
        console.log('123');
        var PostData = await (await new API().GET("/api/posts/get", {post_id: ctx.query.id})).json()
        console.log(PostData);
        var post = PostData.status === 1 ? PostData.response.post_data : null
    }


    return {props: {post, hided}}
}