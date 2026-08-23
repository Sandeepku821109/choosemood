import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllProducts, selectBestSellers, selectProductStatus, selectProductError } from '../../store/slices/productSlice'
import Products from '../products/Products'
import { Crown, Star } from 'lucide-react'

const BestSeller = () => {
    const dispatch = useDispatch()
    const bestSellerProducts = useSelector(selectBestSellers)
    const status = useSelector(selectProductStatus)
    const error = useSelector(selectProductError)
    const loading = status === 'loading'

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchAllProducts())
        }
    }, [status, dispatch])

    if (loading) {
        return (
            <div className="py-14 sm:py-20 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border border-ink-200 border-t-gold-500 mx-auto"></div>
                        <p className="mt-5 text-ink-400 text-sm tracking-widest uppercase">Curating bestsellers...</p>
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

    // Hide the whole section on the storefront when there is nothing to show
    if (!loading && !error && bestSellerProducts.length === 0) return null

    return (
        <section className="relative py-14 sm:py-20 lg:py-24 bg-ink-950 overflow-hidden">
            {/* Ambient decoration */}
            <div className="absolute -top-32 left-1/4 w-[500px] h-[400px] rounded-full bg-gold-600/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-40 right-1/4 w-[500px] h-[400px] rounded-full bg-gold-500/5 blur-3xl pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section Header */}
                <div className="text-center mb-10 sm:mb-16">
                    <div className="flex items-center justify-center gap-4 mb-5">
                        <span className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-gold-500/70"></span>
                        <Crown size={16} className="text-gold-400" />
                        <span className="text-gold-300 font-semibold text-xs uppercase tracking-[0.3em]">
                            Hall of Fame
                        </span>
                        <Crown size={16} className="text-gold-400" />
                        <span className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-gold-500/70"></span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-50 mb-4 animate-fade-in delay-100">
                        Top Selling <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200">Products</span>
                    </h2>
                    <p className="text-ink-300 max-w-xl mx-auto text-sm sm:text-base font-light leading-relaxed animate-fade-in delay-200">
                        Our most popular products that customers can't get enough of
                    </p>
                </div>

                {/* Products Grid - 2 products per row */}
                {bestSellerProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-7 max-w-4xl mx-auto">
                        {bestSellerProducts.map((product, index) => (
                            <div key={product.id} className="group relative">
                                {/* Rank Badge */}
                                <div className="absolute -top-1.5 left-3 z-20">
                                    <div className="bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 text-ink-950 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg ring-1 ring-gold-200/60 flex items-center gap-1">
                                        <Crown size={11} strokeWidth={2.5} />
                                        #{index + 1}
                                    </div>
                                </div>
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
                        <div className="w-16 h-16 mx-auto mb-4 bg-ink-900 rounded-full flex items-center justify-center ring-1 ring-gold-500/30">
                            <Crown size={26} className="text-gold-500" />
                        </div>
                        <h3 className="font-serif text-lg font-medium text-ink-50 mb-2">No Bestsellers Found</h3>
                        <p className="text-ink-400 text-sm font-light">Check back later for our top-selling products.</p>
                    </div>
                )}

                {/* View All Button */}
                {bestSellerProducts.length > 0 && (
                    <div className="text-center mt-10 sm:mt-14">
                        <button
                            onClick={() => window.location.href = '/collections?filter=bestseller'}
                            className="btn-luxury group relative inline-flex items-center gap-3 px-9 py-3.5 text-[13px] font-bold uppercase tracking-[0.18em] rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 hover:from-gold-300 hover:to-gold-500 shadow-xl shadow-gold-600/20 transition-all duration-500"
                        >
                            <span>View All Bestsellers</span>
                            <Crown size={16} className="group-hover:scale-110 transition-transform duration-300" />
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default BestSeller