import { Container, InputGroup, FormControl, Button } from 'react-bootstrap';
import Link from 'next/link'
import {useRouter} from 'next/router'
import { useRef } from 'react';

import API from '../utils/API'

const Header = (props) => {
    const router = useRouter()
    const input = useRef()

    const search = async () => {
      let text = input.current.value

      var {name, category_id} = props.query
      var data = await (await new API().GET("/api/search", {text, name, category_id})).json()
      if (data.status) {
        let posts = data.response.posts
        props.setPosts(posts)
      }
      // Добавить query в ссылке для поиска и проверять наличие города в ссылке, чтобы искать в городе
      // Пофиксить верстку для мобильной версии
      // Добавить оплату автоподнятий
    }

    return (
        <header className="header">
          <div className="menu">
              <div className="nav">
                <Container>
                    <div className="email">
                      <span>help@usluger.com</span>
                    </div>
                    <div className="more">
                      { (props.user && props.user.admin) ? <>
                        <Link href="/admin"><a><span>Админ Панель</span></a></Link>
                        <Link href="/account"><a><span>Личный Кабинет</span></a></Link>
                        <a className="a" onClick={props.logoutAction}><span>Выход</span></a>
                      </> : null}
                      { (props.user && !props.user.admin) ? <>
                        <Link href="/account/add"><a><span>Подать объявление</span></a></Link>
                        <Link href="/account"><a><span>Личный Кабинет</span></a></Link>
                        <a className="a" onClick={props.logoutAction}><span>Выход</span></a>
                      </>  : null}
                      {!props.user ? <>
                        <Link href="/"><a><span>Войти</span></a></Link>
                        <Link href="/"><a><span>Регистрация</span></a></Link>
                        <Link href="/"><a><span>Выбрать город</span></a></Link> 
                      </> : null}
                    </div>
                </Container>
              </div>
                <div className="top">
                <Container>
                  <div className="logo"><Link href="/">Услугер</Link></div>
                  { props.back &&
                    <Button onClick={() => router.back()} className="prev" variant="outline-secondary"><i class="fa fa-angle-left" aria-hidden="true"></i> Назад</Button>
                  }
                  { props.top && 
                    <div className="search-box">
                      <InputGroup className="search">
                        <FormControl
                          ref={input}
                          placeholder="Найти услугу..."
                          aria-label="Найти услугу..."
                          aria-describedby="basic-addon2"
                        />
                        <InputGroup.Append>
                          <Button onClick={search} variant="success">Найти</Button>
                        </InputGroup.Append>
                      </InputGroup>
                    </div>
                  }
                </Container>
              </div>
          </div>
        </header>
    )
}

export default Header