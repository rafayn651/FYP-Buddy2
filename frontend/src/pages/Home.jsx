import React from 'react'
import Navbar from '../components/navbar'
import HeroSection from '../components/Hero'
import Features from '@/components/features'
import PortalsSection from '@/components/PortalsSection'
import AboutSnippet from '@/components/AboutSnippet'
import FooterSection from '@/components/Footer'

const Home = () => {
  return (
    <>    
    <Navbar />
    <HeroSection />
    <Features />
    <PortalsSection/>
    <AboutSnippet/>
    <FooterSection/>
    </>

  )
}

export default Home