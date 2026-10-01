import React from 'react'; import {createRoot} from 'react-dom/client'; import {BrowserRouter} from 'react-router-dom'; import {ThemeProvider,CssBaseline,createTheme} from '@mui/material'; import App from './App';
const theme=createTheme({palette:{primary:{main:'#1565c0'},background:{default:'#f5f7fb'}},shape:{borderRadius:10},typography:{fontFamily:'Inter, Roboto, Arial, sans-serif'}});
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><ThemeProvider theme={theme}><CssBaseline/><App/></ThemeProvider></BrowserRouter></React.StrictMode>);
