import React from 'react'
import Link from 'next/link'
import { Segment, Container, Grid, List, Header } from 'semantic-ui-react'
import Image from 'next/image'
const Footer = () => (
  <div className='menu'>
    <div className='menu-element'>
      <Link href='/'>
      <Image src={'https://licorxpress.vercel.app/sun.png'} width={'40'} height={'40'} alt={''} />
      </Link>
    </div>
    <div className='menu-element'>
      <Link href='/products'>
      <Image src={'https://licorxpress.vercel.app/beer.png'} width={'40'} height={'40'} alt={''} />
      </Link>
    </div>
    <div className='menu-element'>
      <Link href='/cart'>
        <Image src={'https://licorxpress.vercel.app/cart.png'} width={'40'} height={'40'} alt={''} />
      </Link>
    </div>
    <div className='menu-element'>
      <Link href='https://api.whatsapp.com/send/?phone=573177943542&text=I%27m+interested+in+your+car+for+sale&type=phone_number&app_absent=0'>
        <Image src={'https://licorxpress.vercel.app/wppW.png'} width={'70'} height={'70'} alt={''} />
      </Link>
    </div>
  </div>
)

export default Footer
