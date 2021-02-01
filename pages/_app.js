import 'bootstrap/dist/css/bootstrap.min.css';
import NextNprogress from 'nextjs-progressbar';
import { Toast, Spinner } from 'react-bootstrap';
import {useRouter} from 'next/router'
import '../styles/main.css'
import '../fonts/font-awesome-4.7.0/css/font-awesome.css'


import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react';
import API from '../utils/API'

function MyApp({ Component, pageProps}) {
    const [popup, setPopup] = useState(false);
    const [popupName, setPopupName] = useState(false);
    const [popupDesc, setPopupDesc] = useState(false);

    const [loading, setLoading] = useState(false)

    const [user, setUser] = useState()
    const [logged, setLogged] = useState()
    const [stepLogin, setStep] = useState()
    const [cookies, setCookies, removeCookies] = useCookies(["hash", "user_id"])
    const router = useRouter()

    const initData = async () => {
      var {hash, user_id} = cookies
      if (!user || user == 'MustUpdate') {
        if (hash && user_id) {
          const userData = await (await new API().GET("/api/users/get", {auth_token: hash, user_id: Number(user_id)})).json()
          var data_logged = userData.status
          var data_user = userData.status ? userData.response.user_data : null
          var data_step = 3
        }
        else {
          var data_user = null
          var data_logged = 0
          var data_step = 0
        }

        console.log(data_user);

        console.log('INIT');

        setUser(data_user)
        setLogged(data_logged)
        setStep(data_step)
      }
  }

    useEffect(() => {
        initData()
    }, [user])

    const logoutAction = async () => {
        removeCookies("hash")
        removeCookies("user_id")
        setUser(false)
        router.push('/')
        setStep(0)
      }

    const showPopup = (name, desc) => {
      setPopupName(name)
      setPopupDesc(desc)
      setPopup(true)
    }

    const goPage = (to) => {
      router.push(to)
    }

    const Popup = ({setPopup, popup})=> (
        <Toast onClose={() => setPopup(false)} show={popup} delay={3000} autohide className="popup">
        <Toast.Header>
            <img
            src="holder.js/20x20?text=%20"
            className="rounded mr-2"
            alt=""
            />
            <strong className="mr-auto">{popupName}</strong>
            {/* <small>11 mins ago</small> */}
        </Toast.Header>
        <Toast.Body>{popupDesc}</Toast.Body>
        </Toast>
    )
    
    return (
        <>
            <NextNprogress
            color="#29D"
            startPosition={0.3}
            stopDelayMs={200}
            height="3"
            />
            <Component 
            {...pageProps}
            goPage={goPage}
            initData={initData} 
            user={user} 
            logged={logged} 
            setUser={setUser}
            logoutAction={logoutAction}
            stepLogin={stepLogin}
            setStep={setStep}
            showPopup={showPopup}
            setLoading={setLoading}
            />
            <Popup  setPopup={setPopup} popup={popup} />
            {loading && <Spinner className="spinner" animation="grow" variant="success" />}
        </>
    )
  }

  export default MyApp

//   MyApp.getInitialProps = async (ctx) => {
//     const cookies = withCookies(MyApp)

//     console.log(cookies);
//     if (cookies.hash && cookies.user_id) {
//         const userData = await (await new API().GET("/api/users/get", {auth_token: cookies.hash, user_id: Number(cookies.user_id)})).json()
//         console.log(userData);
//         var data_logged = userData.status
//         var data_user = userData.response.user_data
//         var data_step = 3
//       }
//       else {
//         var data_user = null
//         var data_logged = 0
//         var data_step = 0
//       }

//       console.log('LOGGED ',data_logged);
    
//     return {data_logged, data_user, data_step}
//   }

//   export async function getServerSideProps(ctx) {
//     const {hash, user_id} = Cookies(ctx)
//     console.log(hash, user_id);
//     if (hash && user_id) {
//         const userData = await (await new API().GET("/api/users/get", {auth_token: hash, user_id: Number(user_id)})).json()
//         var logged = userData.status
//         var user = userData.response.user_data
//         var step = 3
//       }
//       else {
//         var data_user = null
//         var data_logged = 0
//         var data_step = 0
//       }
//       console.log(123);
    
//     return {props: {data_logged, data_user, data_step}}
//   }
