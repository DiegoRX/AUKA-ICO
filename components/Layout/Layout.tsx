import React, { PropsWithChildren } from 'react'
import { Container } from 'semantic-ui-react'

import Navbar from '@components/NavBar/NavBar'
import Footer from '@components/Footer/Footer'

type LayoutProps = {
  children?: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => (
  <div >
    <Navbar />
    

    {children} 
      {/* <Footer/> */}

  </div>
)

export default Layout
