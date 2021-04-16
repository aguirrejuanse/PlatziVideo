import React from 'react';
import classNames from 'classnames';
import '../assets/styles/components/Search.scss';

const MainTitleText = '¿Que quieres ver hoy?';
const MainInputPlaceholder = 'Buscar...';

const Search = ({ isHome }) => {
    const inputStyle = classNames('input',{
        isHome
    });
    return(
        <section className='main'>
        <h2 className='main__title'>{MainTitleText}</h2>
        <input
            className={inputStyle}
            type='text'
            placeholder={MainInputPlaceholder}
        />
        </section>
    );
};

export default Search;