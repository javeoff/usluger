import { Container } from 'react-bootstrap';

const Footer = (props) => {
    return (
        <footer>
          <Container>
            <span className="name"><b>Услугер</b> - Новый маркетплейс с объявлениями об услугах</span>
            <div className="row">
              <a href="/politics.pdf"><span>Политика конфендициальности</span></a>
              
              { props.user 
                ? <a href="/account"><span>Личный кабинет</span></a>
                : <a href="/"><span>Авторизация</span></a>
              }
            </div>
          </Container>
        </footer>
    )
}

export default Footer