import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { backendUrl } from '../../App'
import Products from '../products/Products'
import { Star, TrendingUp } from 'lucide-react'

const BestProduct = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${backendUrl}/api/products`, {
                params: { limit: 1000 }
            })
            
            // Filter for bestseller products or top-rated products
            const bestProducts = response.data.products
                .filter(product => (product.bestSeller ?? product.bestseller) || product.rating >= 4)
                .slice(0, 8) // Show 8 products (2 rows x 4 products on desktop, 4 rows x 2 products on mobile)
                .map((product) => {
                    return {
                        id: product.id || product._id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        image: product.image,
                        quantity: product.quantity,
                        discount: product.discount || 0,
                        rating: product.rating || 0,
                        bestseller: (product.bestSeller ?? product.bestseller) || false,
                        wishlist: product.wishlist || false
                    }
                })

            setProducts(bestProducts)
        } catch (error) {
            console.error('Error fetching products:', error)
            setError('Failed to load products')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="py-14 sm:py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border border-ink-200 border-t-gold-500 mx-auto"></div>
                        <p className="mt-5 text-ink-400 text-sm tracking-widest uppercase">Curating products...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-14 sm:py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <section className="py-14 sm:py-20 lg:py-24 bg-white relative overflow-hidden">
            {/* Ambient decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-gold-100/40 blur-3xl pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section Header */}
                <div className="text-center mb-10 sm:mb-16">
                    <div className={`flex items-center justify-center gap-4 mb-5 ${products.length > 0 ? 'animate-fade-in' : ''}`}>
                        <span className="gold-line w-10 sm:w-16"></span>
                        <span className="text-gold-700 font-semibold text-xs uppercase tracking-[0.3em]">
                            Curated Selection
                        </span>
                        <span className="gold-line w-10 sm:w-16"></span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-900 mb-4 animate-fade-in delay-100">
                        Our Best Products
                    </h2>
                    <p className="text-ink-400 max-w-xl mx-auto text-sm sm:text-base font-light leading-relaxed animate-fade-in delay-200">
                        Discover our most popular and highly-rated products loved by customers worldwide
                    </p>
                </div>

                {/* Products Grid - 2 products per row on mobile, 4 on desktop */}
                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        {products.map((product) => (
                            <div key={product.id} className="group">
                                <Products
                                    id={product.id}
                                    name={product.name}
                                    image={product.image}
                                    price={product.price}
                                    discount={product.discount}
                                    rating={product.rating}
                                    bestseller={product.bestseller}
                                    wishlist={product.wishlist}
                                    description={product.description}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-ink-50 rounded-full flex items-center justify-center ring-1 ring-ink-100">
                            <Star className="w-7 h-7 text-gold-300" />
                        </div>
                        <h3 className="font-serif text-lg font-medium text-ink-900 mb-2">No Best Products Found</h3>
                        <p className="text-ink-400 text-sm font-light">Check back later for our featured products.</p>
                    </div>
                )}

                {/* View All Button */}
                {products.length > 0 && (
                    <div className="text-center mt-10 sm:mt-14">
                        <button
                            onClick={() => window.location.href = '/collections'}
                            className="btn-luxury group relative inline-flex items-center gap-3 px-9 py-3.5 text-[13px] font-bold uppercase tracking-[0.18em] rounded-full bg-ink-950 text-cream hover:bg-ink-800 ring-1 ring-ink-950 shadow-xl transition-all duration-500"
                        >
                            <span>View All Products</span>
                            <TrendingUp size={17} className="text-gold-400 group-hover:translate-y-[-2px] transition-transform duration-300" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default BestProduct