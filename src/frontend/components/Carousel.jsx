import React from 'react';
import '../assets/styles/components/Carousel.scss';

const Carousel = ({ children }) => (

  <div className='carousel__container'>
    {children}
  </div>

  //o
  // <React.Fragment>
  //     <section className="carousel">
  //     <div className="carousel__container">{children}</div>
  //     </section>
  // </React.Fragment>
);

export default Carousel;
