import Link from 'next/link'
import { useEffect, useState } from "react";
import { useCookies } from 'react-cookie';
import { Container, Button } from 'react-bootstrap';
import MaskedInput from 'react-maskedinput'

import API from '../utils/API'

import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Index(props) {
  const [phone, setPhone] = useState()
  const [code, setCode] = useState()
  const [name, setName] = useState()

  const [cookies, setCookies, removeCookies] = useCookies(["hash", "user_id"])
  const [loginId, setLogin] = useState()

  const [loginButton, setLoginButton] = useState()

  const loginAction = async e => {
    if (phone) {
      const number = phone.split('').filter(s => /[0-9]/g.test(s)).join('')
      if (number.length < 11) return setLoginButton('Укажите телефон');

      let query = {phone: number}
      const data = await (await new API().GET("/login/call", query)).json()
      if (data.status) {
        setLogin(data.loginId)
        props.setStep(1)
        setLoginButton(false)
      }
      else console.log('data', data);
    }
    else {
      setLoginButton('Укажите телефон');
    }
  }

  const confirmAction = async e => {
    if (code) {
      const number = phone.split('').filter(s => /[0-9]/g.test(s)).join('')

      let query = {loginId, code, phone: number}
      const data = await (await new API().GET("/login/confirm", query)).json()
      if (!data.logged && data.register) {
        props.setStep(2)
      }
      else if (data.logged && !data.register) {
        setCookies("hash", data.response["auth_token"])
        setCookies("user_id", data.response["user_id"])
        setLoginButton(false)
        props.setUser('MustUpdate')
        props.setStep(3)
      }

    }
    else {
      setLoginButton('Введите код подтверждения');
    }
  }

  const registerAction = async e => {
    if (code) {
      const number = phone.split('').filter(s => /[0-9]/g.test(s)).join('')

      let query = {loginId, code, phone: number, name}
      const data = await (await new API().GET("/login/register", query)).json()
      if (data.logged) {
        setCookies("hash", data.response["auth_token"])
        setCookies("user_id", data.response["user_id"])
        props.setUser('MustUpdate')
        props.setStep(3)
        setLoginButton(false)
      }
      else console.log('error', data);
    }
    else {
      setLoginButton('Укажите имя пользователя');
    }
  }

  const onEnter = (fn, e) => {
    if (e.key === "Enter") {
      fn()
    }
  }

  return (
    <>
      <Header top={true} user={props.user} logoutAction={props.logoutAction} />
      <section id="get-started">
        <div className="container">
          <span className="header-about">Простой вход в аккаунт</span>
          <span className="desc-about">Вы получите код на номер телефона и автоматически войдете в аккаунт</span>
          <div className="auth-about">
              { props.stepLogin === 0  ? <>
                {/* <input className="form-control" name="card" size="20" placeholder="+7 (111) 111-11-11" onKeyPress={e => onEnter(loginAction, e)} onChange={e => setPhone(e.target.value)} /> */}
                <MaskedInput className="form-control" value="" mask="+7 (111) 111-11-11" name="card" size="20" onChange={e => setPhone(e.target.value)}/>
                <Button variant="success" onClick={loginAction}>{loginButton ? loginButton : "Войти в аккаунт"}</Button>
              </> : null }
              { props.stepLogin === 1 ? <>
                <input className="form-control" placeholder="Код подтверждения SMS" onKeyPress={e => onEnter(confirmAction, e)} onChange={e => setCode(e.target.value)} />
                <Button variant="success" onClick={confirmAction}>{loginButton ? loginButton : "Подтвердить код"}</Button>
              </> : null }
              { props.stepLogin === 2 ? <>
                <input className="form-control" placeholder="Введите свое имя" onKeyPress={e => onEnter(registerAction, e)} onChange={e => setName(e.target.value)} />
                <Button variant="success" onClick={registerAction}>{loginButton ? loginButton : "Регистрация"}</Button>
              </> : null }
              { props.stepLogin === 3 ? <>
                <Link href="/account"><Button variant="success">Личный Кабинет</Button></Link>
                <Button variant="outline-secondary" onClick={props.logoutAction}>Выйти</Button>
              </> : null }
          </div>
        </div>
      </section>
      <section id="cities">
        <div className="container">
          <span className="header-cities">Закажите услугу</span>
          {props.cities && props.cities.map(data => (
            <div>
            <span className="header-desc">{data[0]}</span>
              <ul className="cities-list">
              {data[1].map(row => (
                <div className="col-lg-4 col-md-12">
                  {row.map(city => (
                    <Link href={city[1]}><a><li>{city[0]}</li></a></Link>
                  ))}
                </div>
              ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <Footer user={props.user} />
  </>
  )
}

export async function getServerSideProps(ctx) {
  const Cities = (await (await new API().GET("/api/cities")).json()).response
  const Regions = (await (await new API().GET("/api/regions")).json()).response

  const cities = [
    ["Выберите город:",[Cities.cities1, Cities.cities2, Cities.cities3]], 
    ["Выберите регион:",[Regions.regions1, Regions.regions2, Regions.regions3]]
  ]
  
  return {props: {cities}}
}

