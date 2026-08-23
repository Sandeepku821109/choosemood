import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, Search, ChevronDown, AlertTriangle } from 'lucide-react'
import { backendUrl } from '../../config'
import Products from '../products/Products'

const SORT_OPTIONS = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'new', label: 'Newest First' }
]

const RATING_OPTIONS = [
    { value: 0, label: 'All ratings' },
    { value: 4, label: '4★ & up' },
    { value: 3, label: '3★ & up' },
    { value: 2, label: '2★ & up' }
]

const SectionTitle = ({ children }) => (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400 mb-3">{children}</h3>
)

const FilterContent = ({
    categories, categoryCounts, subcategoryOptions, totalProducts,
    filterBy, setFilterBy, subcategoryFilter, setSubcategoryFilter,
    bestsellerOnly, setBestsellerOnly, saleOnly, setSaleOnly,
    priceMin, setPriceMin, priceMax, setPriceMax,
    minRating, setMinRating, onClearAll, hasActiveFilters
}) => (
    <div className="space-y-7">
        <div>
            <SectionTitle>Category</SectionTitle>
            <div className="space-y-0.5">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => { setFilterBy(category); setSubcategoryFilter('') }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                            filterBy === category
                                ? 'bg-gold-50 text-gold-700 font-semibold ring-1 ring-gold-200'
                                : 'text-ink-600 hover:bg-ink-100/70 hover:text-ink-900'
                        }`}
                    >
                        <span className="capitalize">{category === 'all' ? 'All Products' : category}</span>
                        <span className={`text-xs ${filterBy === category ? 'text-gold-500' : 'text-ink-300'}`}>
                            {category === 'all' ? totalProducts : (categoryCounts[category] || 0)}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {subcategoryOptions.length > 0 && (
            <div>
                <SectionTitle>Subcategory</SectionTitle>
                <div className="flex flex-wrap gap-2">
                    {subcategoryOptions.map(sub => (
                        <button
                            key={sub}
                            onClick={() => setSubcategoryFilter(subcategoryFilter === sub ? '' : sub)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all duration-150 ${
                                subcategoryFilter === sub
                                    ? 'bg-ink-950 text-cream shadow-sm'
                                    : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:ring-ink-400'
                            }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div>
            <SectionTitle>Price</SectionTitle>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-sm text-ink-400">₹</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="block w-full pl-7 pr-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-300 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
                <span className="text-ink-300 text-sm">—</span>
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-sm text-ink-400">₹</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="block w-full pl-7 pr-3 py-2 text-sm border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-300 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>
            </div>
        </div>

        <div>
            <SectionTitle>Customer Rating</SectionTitle>
            <div className="space-y-0.5">
                {RATING_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-ink-100/70 transition-colors duration-150">
                        <input
                            type="radio"
                            name="minRating"
                            checked={minRating === option.value}
                            onChange={() => setMinRating(option.value)}
                            className="h-4 w-4 accent-[#e72744]"
                        />
                        <span className={minRating === option.value ? 'text-ink-900 font-medium' : 'text-ink-600'}>{option.label}</span>
                    </label>
                ))}
            </div>
        </div>

        <div>
            <SectionTitle>Highlights</SectionTitle>
            <div className="space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-ink-700 group-hover:text-ink-900 transition-colors">Bestsellers only</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={bestsellerOnly}
                        onClick={() => setBestsellerOnly(!bestsellerOnly)}
                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${bestsellerOnly ? 'bg-gold-500' : 'bg-ink-200'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform duration-200 ${bestsellerOnly ? 'translate-x-4' : ''}`} />
                    </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm text-ink-700 group-hover:text-ink-900 transition-colors">On sale only</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={saleOnly}
                        onClick={() => setSaleOnly(!saleOnly)}
                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${saleOnly ? 'bg-gold-500' : 'bg-ink-200'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform duration-200 ${saleOnly ? 'translate-x-4' : ''}`} />
                    </button>
                </label>
            </div>
        </div>

        {hasActiveFilters && (
            <button
                onClick={onClearAll}
                className="w-full py-2.5 text-sm font-medium text-gold-600 ring-1 ring-gold-200 rounded-lg hover:bg-gold-50 transition-colors duration-150"
            >
                Clear All Filters
            </button>
        )}
    </div>
)

const Collection = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [filteredProducts, setFilteredProducts] = useState([])
    const [searchParams] = useSearchParams()
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState(searchParams.get('new') === 'true' ? 'new' : 'name')
    const [filterBy, setFilterBy] = useState(searchParams.get('category') || 'all')
    const [subcategoryFilter, setSubcategoryFilter] = useState(searchParams.get('subcategory') || '')
    const [bestsellerOnly, setBestsellerOnly] = useState(searchParams.get('filter') === 'bestseller')
    const [saleOnly, setSaleOnly] = useState(searchParams.get('sale') === 'true')
    const [priceMin, setPriceMin] = useState('')
    const [priceMax, setPriceMax] = useState('')
    const [minRating, setMinRating] = useState(0)
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        document.body.style.overflow = showFilters ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [showFilters])

    const fetchProducts = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await axios.get(`${backendUrl}/api/products`, { params: { limit: 1000 } })
            const allData = response.data.products.map((product) => ({
                id: product.id || product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image,
                quantity: product.quantity,
                discount: product.discount || 0,
                rating: product.rating || 0,
                bestseller: product.bestSeller ?? product.bestseller ?? false,
                wishlist: product.wishlist || false,
                category: product.category || 'general',
                subCategory: product.subCategory || '',
                createdAt: product.createdAt
            }))
            setProducts(allData)
            setFilteredProducts(allData)
        } catch (err) {
            setError('Failed to fetch products. Please try again.')
            console.error('Error fetching products:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let filtered = [...products]

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (filterBy !== 'all') {
            filtered = filtered.filter(product => product.category === filterBy)
        }

        if (subcategoryFilter) {
            filtered = filtered.filter(product =>
                (product.subCategory || '').toLowerCase() === subcategoryFilter.toLowerCase()
            )
        }

        if (bestsellerOnly) {
            filtered = filtered.filter(product => product.bestseller)
        }

        if (saleOnly) {
            filtered = filtered.filter(product => Number(product.discount) > 0)
        }

        const min = parseFloat(priceMin)
        if (!isNaN(min)) filtered = filtered.filter(p => p.price >= min)

        const max = parseFloat(priceMax)
        if (!isNaN(max)) filtered = filtered.filter(p => p.price <= max)

        if (minRating > 0) {
            filtered = filtered.filter(p => p.rating >= minRating)
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name)
                case 'price-low': return a.price - b.price
                case 'price-high': return b.price - a.price
                case 'rating': return b.rating - a.rating
                case 'new': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
                default: return 0
            }
        })

        setFilteredProducts(filtered)
    }, [products, searchTerm, sortBy, filterBy, subcategoryFilter, bestsellerOnly, saleOnly, priceMin, priceMax, minRating])

    useEffect(() => {
        fetchProducts()
    }, [])

    const categories = ['all', ...new Set(products.map(p => p.category))]
    const categoryCounts = products.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1
        return acc
    }, {})
    const subcategoryOptions = [...new Set(
        products
            .filter(p => filterBy === 'all' || p.category === filterBy)
            .map(p => p.subCategory)
            .filter(Boolean)
    )].sort()

    const activeFilters = []
    if (searchTerm) activeFilters.push({ key: 'searchTerm', label: `Search: "${searchTerm}"` })
    if (filterBy !== 'all') activeFilters.push({ key: 'filterBy', label: filterBy.charAt(0).toUpperCase() + filterBy.slice(1) })
    if (subcategoryFilter) activeFilters.push({ key: 'subcategoryFilter', label: subcategoryFilter })
    if (bestsellerOnly) activeFilters.push({ key: 'bestsellerOnly', label: 'Bestsellers' })
    if (saleOnly) activeFilters.push({ key: 'saleOnly', label: 'On Sale' })
    if (priceMin) activeFilters.push({ key: 'priceMin', label: `Min ₹${priceMin}` })
    if (priceMax) activeFilters.push({ key: 'priceMax', label: `Max ₹${priceMax}` })
    if (minRating > 0) activeFilters.push({ key: 'minRating', label: `${minRating}★ & up` })

    const removeFilter = (key) => {
        switch (key) {
            case 'searchTerm': setSearchTerm(''); break
            case 'filterBy': setFilterBy('all'); break
            case 'subcategoryFilter': setSubcategoryFilter(''); break
            case 'bestsellerOnly': setBestsellerOnly(false); break
            case 'saleOnly': setSaleOnly(false); break
            case 'priceMin': setPriceMin(''); break
            case 'priceMax': setPriceMax(''); break
            case 'minRating': setMinRating(0); break
            default: break
        }
    }

    const clearAllFilters = () => {
        setSearchTerm('')
        setFilterBy('all')
        setSubcategoryFilter('')
        setBestsellerOnly(false)
        setSaleOnly(false)
        setPriceMin('')
        setPriceMax('')
        setMinRating(0)
    }

    const filterProps = {
        categories, categoryCounts, subcategoryOptions, totalProducts: products.length,
        filterBy, setFilterBy, subcategoryFilter, setSubcategoryFilter,
        bestsellerOnly, setBestsellerOnly, saleOnly, setSaleOnly,
        priceMin, setPriceMin, priceMax, setPriceMax,
        minRating, setMinRating,
        onClearAll: clearAllFilters,
        hasActiveFilters: activeFilters.length > 0
    }

    return (
        <div className="min-h-screen bg-ink-50/70">
            {/* Page Header */}
            <header className="bg-white border-b border-ink-100">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-7 sm:py-9">
                    <nav className="flex items-center gap-1.5 text-xs text-ink-400 mb-3">
                        <Link to="/" className="hover:text-gold-600 transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-ink-700 font-medium">Collections</span>
                    </nav>
                    <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-ink-950 tracking-tight">Our Collection</h1>
                    <p className="mt-2 text-sm sm:text-base text-ink-500 max-w-xl">
                        Explore the full range — filter by category, price and rating to find exactly what you're looking for.
                    </p>
                </div>
            </header>

            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
                {/* Sticky Toolbar */}
                <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 bg-white/85 backdrop-blur-md border-b border-ink-100">
                    <div className="flex items-center gap-3 py-3">
                        <button
                            onClick={() => setShowFilters(true)}
                            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink-800 bg-white ring-1 ring-ink-200 rounded-lg hover:ring-ink-400 transition-all"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filters
                            {activeFilters.length > 0 && (
                                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-gold-500 text-white text-[11px] font-bold">
                                    {activeFilters.length}
                                </span>
                            )}
                        </button>

                        <p className="hidden sm:block text-sm text-ink-500">
                            Showing <span className="font-semibold text-ink-900">{filteredProducts.length}</span> of {products.length} products
                        </p>

                        <div className="ml-auto relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                aria-label="Sort products"
                                className="appearance-none pl-3.5 pr-9 py-2 text-sm font-medium bg-white ring-1 ring-ink-200 rounded-lg cursor-pointer hover:ring-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300 transition-all"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-8 pt-6 pb-16">
                    {/* Desktop Filter Sidebar */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-16 bg-white rounded-2xl ring-1 ring-ink-100 shadow-sm p-5 max-h-[calc(100vh-6rem)] overflow-y-auto">
                            <FilterContent {...filterProps} />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Active Filter Chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-5">
                                {activeFilters.map(filter => (
                                    <span key={filter.key} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-white ring-1 ring-ink-200 rounded-full text-xs font-medium text-ink-700">
                                        {filter.label}
                                        <button
                                            onClick={() => removeFilter(filter.key)}
                                            aria-label={`Remove ${filter.label} filter`}
                                            className="p-0.5 rounded-full hover:bg-ink-100 transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                                {activeFilters.length > 1 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="ml-1 text-xs font-semibold text-gold-600 hover:text-gold-700 underline underline-offset-2"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl ring-1 ring-ink-100 overflow-hidden">
                                        <div className="aspect-square bg-ink-100 animate-pulse" />
                                        <div className="p-4 space-y-2.5">
                                            <div className="h-3 w-20 bg-ink-100 rounded animate-pulse" />
                                            <div className="h-4 w-full bg-ink-100 rounded animate-pulse" />
                                            <div className="h-5 w-24 bg-ink-100 rounded animate-pulse" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-white ring-1 ring-red-100 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto mt-8">
                                <AlertTriangle className="h-11 w-11 text-gold-500 mx-auto mb-4" strokeWidth={1.5} />
                                <h3 className="font-serif text-lg font-semibold text-ink-900 mb-1.5">Something went wrong</h3>
                                <p className="text-sm text-ink-500 mb-6">{error}</p>
                                <button
                                    onClick={fetchProducts}
                                    className="inline-flex items-center px-5 py-2.5 bg-gold-500 text-white text-sm font-medium rounded-lg hover:bg-gold-600 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                {filteredProducts.map((product) => (
                                    <Products
                                        key={product.id}
                                        id={product.id}
                                        name={product.name}
                                        description={product.description}
                                        price={product.price}
                                        image={product.image}
                                        discount={product.discount}
                                        rating={product.rating}
                                        bestseller={product.bestseller}
                                        wishlist={product.wishlist}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white ring-1 ring-ink-100 rounded-2xl py-14 sm:py-20 px-6 text-center">
                                <div className="h-14 w-14 rounded-full bg-ink-50 flex items-center justify-center mx-auto mb-5">
                                    <Search className="h-6 w-6 text-ink-300" />
                                </div>
                                <h3 className="font-serif text-lg font-semibold text-ink-900 mb-1.5">No products found</h3>
                                <p className="text-sm text-ink-500 mb-7 max-w-sm mx-auto">
                                    {searchTerm
                                        ? `Nothing matches "${searchTerm}". Try a different search or remove some filters.`
                                        : 'No products match your current filters.'}
                                </p>
                                {activeFilters.length > 0 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center px-5 py-2.5 bg-gold-500 text-white text-sm font-medium rounded-lg hover:bg-gold-600 transition-colors"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showFilters && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]"
                        onClick={() => setShowFilters(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-80 max-w-[86vw] bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
                            <h2 className="font-serif text-base font-semibold text-ink-900">Filters</h2>
                            <button
                                onClick={() => setShowFilters(false)}
                                aria-label="Close filters"
                                className="p-2 -mr-2 rounded-full hover:bg-ink-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-ink-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-6">
                            <FilterContent {...filterProps} />
                        </div>
                        <div className="border-t border-ink-100 p-4">
                            <button
                                onClick={() => setShowFilters(false)}
                                className="w-full py-3 bg-ink-950 text-cream text-sm font-semibold rounded-xl hover:bg-ink-800 transition-colors"
                            >
                                Show {filteredProducts.length} Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Collection
