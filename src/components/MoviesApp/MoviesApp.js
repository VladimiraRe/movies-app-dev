/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import lodashDebounce from 'lodash.debounce';

import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    state = {
        search: '',
        isOnline: navigator.onLine,
    };

    changeSearch = (e) => {
        const newValue = e.target.value;
        this.setState(({ search }) => {
            if (!search === newValue) return false;
            return { search: newValue };
        });
    };

    changeSearchDebounce = (e) => {
        const debobounce = lodashDebounce(() => this.changeSearch(e), 5000);
        debobounce();
    };

    render() {
        const { search, isOnline } = this.state;
        if (isOnline) {
            window.addEventListener('offline', () => this.setState({ isOnline: false }));
        } else {
            window.addEventListener('online', () => this.setState({ isOnline: true }));
        }

        return (
            <Layout className='moviesApp'>
                {isOnline ? (
                    <Content inputFunc={this.changeSearchDebounce} search={search} />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}

function Content({ search, inputFunc }) {
    return (
        <>
            <Input onChange={inputFunc} placeholder='Type to search...' />
            <MoviesList search={search} />
        </>
    );
}
