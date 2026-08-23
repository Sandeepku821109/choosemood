import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import axios from 'axios'
import { backendUrl } from '../../config'

// Single source of truth for the product catalog.
// Home sections (BestProduct / BestSeller / etc.) all read from this slice,
// so the full-catalog request happens once instead of once per component.

export const fetchAllProducts = createAsyncThunk(
    'products/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${backendUrl}/api/products`, {
                params: { limit: 1000 },
            })
            const docs = response.data?.products || []
            return docs.map(normalizeProduct)
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to load products'
            )
        }
    }
)

// Shape returned by GET /api/products -> card-ready object.
const normalizeProduct = (product) => ({
    id: product.id || product._id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    quantity: product.quantity,
    discount: product.discount || 0,
    rating: product.rating || 0,
    bestseller: (product.bestSeller ?? product.bestseller) || false,
    wishlist: product.wishlist || false,
})

const initialState = {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
}

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllProducts.pending, (state) => {
                state.status = 'loading'
                state.error = null
            })
            .addCase(fetchAllProducts.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.items = action.payload
            })
            .addCase(fetchAllProducts.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.payload || 'Something went wrong'
            })
    },
})

export default productSlice.reducer

// --- selectors -----------------------------------------------------------

export const selectAllProducts = (state) => state.product.items
export const selectProductStatus = (state) => state.product.status
export const selectProductError = (state) => state.product.error

// Memoized derived lists: createSelector caches the result, so the same
// array reference is returned until `items` actually changes in the store.
export const selectBestSellers = createSelector(
    [selectAllProducts],
    (items) => items.filter((p) => p.bestseller === true).slice(0, 6)
)

export const selectTopRated = createSelector(
    [selectAllProducts],
    (items) =>
        items
            .filter((p) => p.bestseller || p.rating >= 4)
            .slice(0, 8)
)
