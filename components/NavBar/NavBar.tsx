import React from 'react'
import Link from 'next/link'
import { useAppContext } from 'context/state'
import Image from 'next/image'


const NavBar = ({}) => {
    const {connectWallet, walletAddress,onWalletConnectedCallback} = useAppContext()
 
    return (
        <nav className='nav-container'>
                {/* <Link href='/'>
                    hhh
                </Link> */}

        </nav>
    )
}

export default NavBar

// import React, { Component, useState } from 'react'
// import Link from 'next/link'
// import { Menu, Segment } from 'semantic-ui-react'

// const NavBar = ({ }) => {
//   const [activeItem, setActiveItem] = useState('home')


//   const handleItemClick = (e, { name }) => {
//     setActiveItem(name)
//   }



//   return (
//     <nav className='nav-container'>
//       {/* <menu>
//                 Home</Link>
//                 <Link href='/farms'>Farms</Link>
//                 <Link href='/staking'>Staking</Link>
//             </menu> */}
//       <Menu pointing secondary style={{ margin: 0 }}>
//         <Link href='/'><Menu.Item
//           name='home'
//           active={activeItem === 'home'}
//           onClick={handleItemClick}
//         /></Link>
//         <Link href='/farms'>
//           <Menu.Item
//             name='Farms'
//             active={activeItem === 'Farms'}
//             onClick={handleItemClick}
//           /></Link>
//         <Link href='/staking'>
//           <Menu.Item
//             name='Staking'
//             active={activeItem === 'Staking'}
//             onClick={handleItemClick}
//           /></Link>
//       </Menu>
//       <button className='ui positive button' >Connect Wallet</button>
//     </nav>
//   )
// }

// export default NavBar