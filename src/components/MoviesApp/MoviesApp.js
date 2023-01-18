/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import lodashDebounce from 'lodash.debounce';

import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    state = {
        inputValue: '',
        search: '',
        isOnline: navigator.onLine,
    };

    changeValue = (value, e) => {
        const newValue = e.target.value;
        this.setState(({ search }) => {
            if (!search === newValue) return false;
            return { [value]: newValue };
        });
    };

    changeSearch = (e) => {
        this.changeValue('inputValue', e);
        const debobounce = lodashDebounce(() => {
            this.changeValue('search', e);
            this.setState({ inputValue: '' });
        }, 2000);
        debobounce();
    };

    render() {
        const { search, inputValue, isOnline } = this.state;
        if (isOnline) {
            window.addEventListener('offline', () => this.setState({ isOnline: false }));
        } else {
            window.addEventListener('online', () => this.setState({ isOnline: true }));
        }

        return (
            <Layout className='moviesApp'>
                {isOnline ? (
                    <Content inputFunc={this.changeSearch} search={search} value={inputValue} />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}

function Content({ search, value, inputFunc }) {
    return (
        <>
            <Input onChange={inputFunc} placeholder='Type to search...' value={value} />
            <MoviesList search={search} />
        </>
    );
}
