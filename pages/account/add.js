import Header from '../../components/Header'
import Footer from '../../components/Footer'
import styles from './Account.module.css'

import API from '../../utils/API'

import { Container, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useCookies } from 'react-cookie';

const Add = (props) => {
    const [input1, setInput1] = useState() // City
    const [input2, setInput2] = useState() // Categories

    const [pcitiesList, psetCitiesList] = useState()
    const [citiesList, setCitiesList] = useState(props.cities)
    const [categoriesList, setCategoriesList] = useState(props.categories)
    const [pcategoriesList, psetCategoriesList] = useState()
    const [lcategoriesList, lsetCategoriesList] = useState()
    const [cookies, setCookies, removeCookies] = useCookies(["hash", "user_id"])
    const router = useRouter()
    
    const city_name = useRef()
    const category_name = useRef()
    const pcity_name = useRef()
    const pcategory_name = useRef()
    const lcategory_name = useRef()
    const item_name = useRef()
    const item_desc = useRef()
    const item_image1 = useRef()
    const item_image2 = useRef()
    const item_image3 = useRef()

    useEffect(async () => {
        //value={(props.pcity_id !== "000") ? props.pcity_id : "000"}
        if (city_name.current && pcity_name.current) {
            // if (props.pcity_id !== "000") {
            //     city_name.current.value = props.pcity_id
            //     setInput1(props.pcity_id)
            //     pcity_name.current.disabled = false
            //     pcity_name.current.value = props.city_id
            // }
            if (props.city_id !== "000" && city_name.current.value === "000") {
                city_name.current.value = props.city_id
                pcity_name.current.disabled = true

                var CitiesData = await (await new API().GET("/api/cities/parent", {city_parent: Number(props.city_id)})).json()
                var cities = CitiesData.status && CitiesData.response.cities || null
                
                await psetCitiesList(cities)
                pcity_name.current.disabled = false
                // setInput1(props.city_id)
            }
            if (props.pcity_id !== "000" && pcity_name.current.value === "000") {
                pcity_name.current.value = props.pcity_id
            }
        }

        if (category_name.current && pcategory_name.current) {
            if (props.pcategory_id !== "000" && pcategory_name.current.value === "000") {
                // Есть третья ветка категории, добавить третье поле и получать last_catecory_id
                pcategory_name.current.disabled = true
                var CategoriesData = await (await new API().GET("/api/categories/find", {parent_id: Number(props.category_id)})).json()
                var categories = CategoriesData.status && CategoriesData.response.categories || null

                await psetCategoriesList(categories)
                pcategory_name.current.disabled = false
                pcategory_name.current.value = props.pcategory_id    
            }
            if (props.category_id !== "000" && category_name.current.value === "000") {
                category_name.current.value = props.category_id
            }
            if (props.lcategory_id !== "000" && lcategory_name.current && lcategory_name.current.value === "000") {
                lcategory_name.current.disabled = true
                var CategoriesData = await (await new API().GET("/api/categories/find", {parent_id: Number(props.pcategory_id)})).json()
                console.log(CategoriesData);
                var categories = CategoriesData.status && CategoriesData.response.categories || null

                if (categories) {
                    await lsetCategoriesList(categories)
                    lcategory_name.current.disabled = false
                    lcategory_name.current.value = props.lcategory_id    
                }
            }
        }
    })

    useEffect(async () => {
        if (props.user) {
            psetCitiesList()
            pcity_name.current.disabled = true
            console.log(input1);
            if (input1) {
                var CitiesData = await (await new API().GET("/api/cities/parent", {city_parent: Number(input1)})).json()
                var cities = CitiesData.status && CitiesData.response.cities || null
                console.log(cities);
                psetCitiesList(cities)
                pcity_name.current.disabled = false
            }
        }
    }, [input1])

    useEffect(async () => {
        if (props.user) {
            psetCategoriesList()
            pcategory_name.current.disabled = true
            if (input2) {
                var CategoriesData = await (await new API().GET("/api/categories/find", {parent_id: Number(input2)})).json()
                var categories = CategoriesData.status && CategoriesData.response.categories || null
                console.log(categories);
                psetCategoriesList(categories)
                pcategory_name.current.disabled = false
            }
        }
    }, [input2])

    var item_table = []
    item_table[0] = [useRef(), useRef(), useRef()]
    item_table[1] = [useRef(), useRef(), useRef()]
    item_table[2] = [useRef(), useRef(), useRef()]
    item_table[3] = [useRef(), useRef(), useRef()]

    const addItem = async () => {
        props.setLoading(true)
        var status = 1

        item_image1.current.classList.remove('red')
        category_name.current.classList.remove('red')
        city_name.current.classList.remove('red')
        pcity_name.current.classList.remove('red')
        item_desc.current.classList.remove('red')
        item_name.current.classList.remove('red')

        if (!item_name.current.value || item_name.current.value < 5) {
            item_name.current.classList.add('red')
            status = 0
        }
        if (!item_desc.current.value || item_desc.current.value < 5) {
            item_desc.current.classList.add('red')
            status = 0
        }
        if (!city_name.current.value || city_name.current.value == "000") {
            city_name.current.classList.add('red')
            status = 0
        }
        if (!pcity_name.current.value || pcity_name.current.value == "000") {
            pcity_name.current.classList.add('red')
            status = 0
        }
        if (!category_name.current.value || category_name.current.value == "000") {
            category_name.current.classList.add('red')
            status = 0
        }
        if (!item_image1.current.files[0]) {
            item_image1.current.classList.add('red')
            status = 0
        }
        for (let i=0; i < 4; i++) {
            if (item_table[i][0].current.value !== "" && 
            item_table[i][0].current.value !== "" && 
            item_table[i][0].current.value.length < 5 && 
            !/^\d+$/.test(item_table[i][1])) {
                item_table[i].forEach(i => i.current.classList.add('red'))
                status = 0
            }
            else {
                item_table[i].forEach(i => i.current.classList.remove('red'))
            }
        }
        

        if (status == 0) {
            props.showPopup('Ошибка', 'Не все поля заполнены верно')
            props.setLoading(false)
            return
        }

        let data = {
            auth_token: cookies.hash,
            city_id: pcity_name.current.value,
            category_id: pcategory_name.current.value ? pcategory_name.current.value : category_name.current.value,
            author_id: cookies.user_id,
            item_table1: item_table[0].map(e => e.current.value).join(' '),
            item_table2: item_table[1].map(e => e.current.value).join(' '),
            item_table3: item_table[2].map(e => e.current.value).join(' '),
            item_table4: item_table[3].map(e => e.current.value).join(' '),
            post_name: item_name.current.value,
            post_description: item_desc.current.value,
            item_image1: item_image1.current.files[0],
            item_image2: item_image2.current.files[0],
            item_image3: item_image3.current.files[0],
        }

        var addPost = await (await new API().addFiles("/api/posts/add", data)).json()
        if (addPost.status) {
            props.setLoading(false)
            router.back()
            props.showPopup('Новое объявление', 'Новое объявление успешно добавлено')
        }
        else {
            props.setLoading(false)
            props.showPopup('Ошибка с сервера', addPost.response)
        }
    }
    const tablebox = useRef()
    var fieldCounter = 1

    return (
        props.user ?
        <>
            <Header user={props.user} logoutAction={props.logoutAction} back={true} />
            <section id="addPost">
                <Container>
                    <div className={styles.boxadd}>
                        <h4>Добавить объявление</h4>
                        <Form>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Название объявления*</Form.Label>
                            <Form.Control ref={item_name} type="email" placeholder="Введите название" />
                        </Form.Group>

                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Описание объявления*</Form.Label>
                            <Form.Control ref={item_desc} as="textarea" rows={4} />
                        </Form.Group>

                        <Form.Label>Выбор категории</Form.Label>
                        <Form.Control
                            onChange={e => setInput2(e.target.value)}
                            ref={category_name}
                            as="select"
                            className="my-1 mr-sm-2"
                            id="inlineFormCustomSelectPref"
                            custom
                        >
                            <option value="000">Выбрать категорию*</option>
                            {categoriesList.map(clist => (
                                clist.map(category => (
                                    <option value={category.id}>{category.name}</option>
                                ))
                            ))}
                        </Form.Control>

                        <Form.Control
                            ref={pcategory_name}
                            as="select"
                            className="my-1 mr-sm-2"
                            id="inlineFormCustomSelectPref"
                            custom
                            disabled
                        >
                            <option value="000">Выбрать подкатегорию</option>
                            {pcategoriesList && pcategoriesList.map(clist => (
                                clist.map(category => (
                                    <option value={category.id}>{category.name}</option>
                                ))
                            ))}
                        </Form.Control>

                        { (pcategory_name.current && pcategory_name.current.value !== '000') ?
                            <Form.Control
                                ref={lcategory_name}
                                as="select"
                                className="my-1 mr-sm-2"
                                id="inlineFormCustomSelectPref"
                                custom
                                disabled
                            >
                                <option value="000">Выбрать подкатегорию</option>
                                {lcategoriesList && lcategoriesList.map(clist => (
                                    clist.map(category => (
                                        <option value={category.id}>{category.name}</option>
                                    ))
                                ))}
                            </Form.Control>
                        : null }

                        <Form.Label>Выбор города</Form.Label>

                        <Form.Control
                            onChange={e => setInput1(e.target.value)}
                            ref={city_name}
                            as="select"
                            className="my-1 mr-sm-2"
                            id="inlineFormCustomSelectPref"
                            custom
                        >
                            <option value="000">Выбрать область*</option>
                            {citiesList && citiesList.map(city => (
                                    <option value={city[2]}>{city[0]}</option>
                            ))}
                        </Form.Control>

                        <Form.Control
                            ref={pcity_name}
                            as="select"
                            className="my-1 mr-sm-2"
                            id="inlineFormCustomSelectPref"
                            custom
                            disabled
                        >
                            <option value="000">Выбрать город*</option>
                            {pcitiesList && pcitiesList.map(city => (
                                    <option value={city["city_id"]}>{city["city_name"]}</option>
                            ))}
                        </Form.Control>

                        <Form.Label>Выбор изображений</Form.Label>

                        <Form.Group>
                            <Form.File ref={item_image1} id="exampleFormControlFile1" accept="image/*" />
                        </Form.Group>
                        <Form.Group>
                            <Form.File ref={item_image2} id="exampleFormControlFile1" accept="image/*" />
                        </Form.Group>
                        <Form.Group>
                            <Form.File ref={item_image3} id="exampleFormControlFile1" accept="image/*" />
                        </Form.Group>

                        <div ref={tablebox}>
                            { new Array(4).fill('').map((_, i) => (
                                <Row>
                                    <Col xs={6}><Form.Control ref={item_table[i][0]} placeholder="Название услуги" /></Col>
                                    <Col><Form.Control ref={item_table[i][1]} placeholder="Стоимость" /></Col>
                                    <Col>
                                        <Form.Control
                                            ref={item_table[i][2]}
                                            as="select"
                                            className="my-1 mr-sm-2"
                                            id="inlineFormCustomSelectPref"
                                            custom
                                        >
                                            <option value="">Тип</option>
                                            <option value="за шт.">за шт.</option>
                                            <option value="в час">час</option>
                                            <option value="академ. час">академ. час</option>
                                            <option value="за услугу">за услугу</option>
                                        </Form.Control>
                                    </Col>
                                </Row>
                            ))}
                        </div>

                        <Button variant="primary" onClick={addItem}>
                            Отправить на модерацию
                        </Button>
                        </Form>
                    </div>
                </Container>
            </section>
            <Footer user={props.user} />
        </>
        :  <Spinner className="spinner" animation="grow" variant="success" />
    )
}

export default Add

export async function getServerSideProps(ctx) {
    const {category_id, pcategory_id, lcategory_id, city_id, pcity_id} = ctx.query

    var CategoriesData = await (await new API().GET("/api/categories")).json()
    var CitiesData = await (await new API().GET("/api/regions")).json()

    var categories = CategoriesData.status && CategoriesData.response.categories || null
    var cities = CitiesData.status && [...CitiesData.response.regions1, ...CitiesData.response.regions2, ...CitiesData.response.regions3] || null



    return {props: {categories, cities, category_id, pcategory_id, lcategory_id, city_id, pcity_id}}
}