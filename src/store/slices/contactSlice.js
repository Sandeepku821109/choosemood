
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

import config from '../../config'

const backendUrl = config.backendUrl

const initialState = {
    messages: [],
    currentMessage: null,
    loading: false,
    error: null,
    success: false
};

const createMessage = createAsyncThunk(
    'contact/createMessage',
    async (message, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${backendUrl}/api/contact`, message);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 400) {
                return rejectWithValue(error.response.data.message);
            } else {
                return rejectWithValue('Failed to send message. Please try again.');
            }
        }
    }
);

const getAllMessages = createAsyncThunk(
    'contact/getAllMessages',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${backendUrl}/api/contact`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return rejectWithValue('Authentication failed. Please log in again.');
            } else {
                return rejectWithValue('Failed to get messages');
            }
        }
    }
);

const getMessageById = createAsyncThunk(
    'contact/getMessageById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${backendUrl}/api/contact/${id}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return rejectWithValue('Authentication failed. Please log in again.');
            } else {
                return rejectWithValue('Failed to get message by ID');
            }
        }
    }
);

const deleteMessage = createAsyncThunk(
    'contact/deleteMessage',
    async (id, { rejectWithValue }) => {
        try {
            const response = await axios.delete(`${backendUrl}/api/contact/${id}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return rejectWithValue('Authentication failed. Please log in again.');
            } else {
                return rejectWithValue('Failed to delete message');
            }
        }
    }
);

const contactSlice = createSlice({
    name: 'contact',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
        },
        clearCurrentMessage: (state) => {
            state.currentMessage = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Message
            .addCase(createMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createMessage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.messages.push(action.payload.message || action.payload);
            })
            .addCase(createMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.success = false;
            })
            // Get All Messages
            .addCase(getAllMessages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload.messages || action.payload;
            })
            .addCase(getAllMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Get Message By ID
            .addCase(getMessageById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMessageById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMessage = action.payload.message || action.payload;
            })
            .addCase(getMessageById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete Message
            .addCase(deleteMessage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteMessage.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.messages = state.messages.filter(
                    message => message._id !== action.meta.arg
                );
            })
            .addCase(deleteMessage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError, clearSuccess, clearCurrentMessage } = contactSlice.actions;
export { createMessage, getAllMessages, getMessageById, deleteMessage };
export default contactSlice.reducer;
