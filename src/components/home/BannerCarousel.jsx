
import React, { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

const BannerCarousel = () => {
  const navigate = useNavigate()
  const [activeSlide, setActiveSlide] = useState(0)

  // Banner data
  const bannerData = [
    {
      id: 1,
      title: "Summer Collection 2025",
      subtitle: "Discover the Latest Trends",
      description: "Explore our newest arrivals with up to 50% off on selected items. Limited time offer!",
      buttonText: "Shop Now",
      buttonLink: "/collections",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      mobileImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      title: "Premium Quality Products",
      subtitle: "Crafted with Excellence",
      description: "Experience luxury and comfort with our premium product line. Quality guaranteed.",
      buttonText: "Explore Premium",
      buttonLink: "/collections?category=premium",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2126&q=80",
      mobileImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      title: "Flash Sale",
      subtitle: "Up to 70% Off",
      description: "Don't miss out on our biggest sale of the year. Hurry, limited stock available!",
      buttonText: "Shop Sale",
      buttonLink: "/collections?sale=true",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      mobileImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      title: "New Arrivals",
      subtitle: "Fresh & Trendy",
      description: "Check out our latest collection featuring the most trending styles of the season.",
      buttonText: "View New",
      buttonLink: "/collections?new=true",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      mobileImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    }
  ]

  const handleSlideChange = (swiper) => {
    setActiveSlide(swiper.realIndex)
  }

  const handleButtonClick = (link) => {
    navigate(link)
  }

  return (
    <div className="relative w-full overflow-hidden bg-ink-950">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={{
          el: '.swiper-pagination-custom',
          clickable: true,
          renderBullet: (index, className) => {
            return `<span class="${className} custom-bullet"></span>`
          },
        }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        loop={true}
        speed={1200}
        onSlideChange={handleSlideChange}
        className="banner-carousel group/carousel"
      >
        {bannerData.map((slide, index) => {
          const isActive = index === activeSlide
          return (
            <SwiperSlide key={slide.id}>
              <div className="relative w-full h-[78vh] min-h-[480px] sm:min-h-[560px] lg:h-[86vh] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                  {/* Desktop Image */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={`hidden sm:block w-full h-full object-cover ${isActive ? 'animate-ken-burns' : ''}`}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  {/* Mobile Image */}
                  <img
                    src={slide.mobileImage}
                    alt={slide.title}
                    className={`block sm:hidden w-full h-full object-cover ${isActive ? 'animate-ken-burns' : ''}`}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex items-center">
                  <div className="container mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
                    <div className="max-w-2xl">
                      {/* Eyebrow */}
                      <div className={`flex items-center gap-4 mb-5 sm:mb-7 ${isActive ? 'animate-slide-up' : 'opacity-0'}`}>
                        <span className="gold-line w-12"></span>
                        <span className="text-gold-300 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.32em]">
                          {slide.subtitle}
                        </span>
                      </div>

                      {/* Title */}
                      <h1 className={`font-serif text-ink-50 text-4xl sm:text-6xl lg:text-7xl leading-[1.05] mb-5 sm:mb-7 ${isActive ? 'animate-slide-up delay-100' : 'opacity-0'}`}>
                        {slide.title.split(' ').slice(0, -1).join(' ')}{' '}
                        <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200">{slide.title.split(' ').slice(-1)}</span>
                      </h1>

                      {/* Description */}
                      <p className={`text-ink-100/80 text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg mb-8 sm:mb-10 font-light ${isActive ? 'animate-slide-up delay-300' : 'opacity-0'}`}>
                        {slide.description}
                      </p>

                      {/* CTA Buttons */}
                      <div className={`flex flex-col xs:flex-row sm:flex-row gap-3 sm:gap-4 ${isActive ? 'animate-slide-up delay-500' : 'opacity-0'}`}>
                        <button
                          onClick={() => handleButtonClick(slide.buttonLink)}
                          className="btn-luxury group/btn relative inline-flex items-center justify-center gap-3 bg-cream text-ink-950 px-8 py-3.5 rounded-full text-[13px] font-bold uppercase tracking-[0.16em] hover:bg-gold-100 transition-all duration-500 shadow-2xl hover:shadow-gold-500/20"
                        >
                          <ShoppingBag size={17} strokeWidth={2} />
                          <span>{slide.buttonText}</span>
                          <ArrowRight size={16} className="group-hover/btn:translate-x-1.5 transition-transform duration-300" />
                        </button>
                        
                        <button
                          onClick={() => navigate('/about')}
                          className="group/about inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-[13px] font-semibold uppercase tracking-[0.16em] text-ink-50 ring-1 ring-white/30 backdrop-blur-md hover:bg-white/10 hover:ring-white/60 transition-all duration-500"
                        >
                          <span>Learn More</span>
                          <ArrowUpRight size={15} className="group-hover/about:translate-x-0.5 group-hover/about:-translate-y-0.5 transition-transform duration-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide number watermark */}
                <div className="absolute bottom-10 right-8 sm:right-14 z-10 hidden md:block select-none pointer-events-none">
                  <span className="font-serif text-7xl lg:text-8xl italic text-white/10">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500">
        <button aria-label="Previous slide" className="swiper-button-prev-custom w-11 h-11 sm:w-13 sm:h-13 glass-dark rounded-full flex items-center justify-center text-ink-50 hover:bg-ink-950 hover:ring-1 hover:ring-gold-400/60 transition-all duration-300">
          <ChevronLeft size={20} />
        </button>
      </div>
      <div className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500">
        <button aria-label="Next slide" className="swiper-button-next-custom w-11 h-11 sm:w-13 sm:h-13 glass-dark rounded-full flex items-center justify-center text-ink-50 hover:bg-ink-950 hover:ring-1 hover:ring-gold-400/60 transition-all duration-300">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Custom Pagination */}
      <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 z-20 swiper-pagination-custom"></div>
    </div>
  )
}

export default BannerCarousel
