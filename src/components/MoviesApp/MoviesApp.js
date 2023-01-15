/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Spin, Alert } from 'antd';

import TheMovieDB from '../../requests/TheMovieDB';
import MoviesList from '../MoviesList';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    theMovieDB = new TheMovieDB();

    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            data: [],
            baseImgUrl: '',
        };
    }

    componentDidMount() {
        this.theMovieDB
            .getBaseImgUrl()
            .then((url) =>
                this.setState({
                    baseImgUrl: url,
                })
            )
            .catch(() => {
                this.setState({
                    baseImgUrl: false,
                });
            });
        this.searchMovies('return');
    }

    searchMovies(request) {
        const { isLoaded } = this.state;
        if (isLoaded === true) {
            this.setState({ isLoaded: false });
        }
        this.theMovieDB
            .getListOfMovies(request)
            .then((movies) =>
                this.setState({
                    data: movies,
                    isLoaded: true,
                })
            )
            .catch(() =>
                this.setState({
                    data: false,
                })
            );
    }

    render() {
        const { data, isLoaded, baseImgUrl } = this.state;
        if (data === false) {
            return (
                <Layout className='moviesApp'>
                    <Alert
                        message='Oops'
                        description='Sorry, something is wrong. Please try again later'
                        type='error'
                    />
                </Layout>
            );
        }
        if (isLoaded === false) {
            return (
                <Layout className='moviesApp'>
                    <Spin tip='Loading' />;
                </Layout>
            );
        }
        return (
            <Layout className='moviesApp'>
                <MoviesList data={data.results} baseImgUrl={baseImgUrl} />;
            </Layout>
        );
    }
}
