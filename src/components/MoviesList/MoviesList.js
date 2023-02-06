import { Component } from 'react';
import PropTypes from 'prop-types';
import { List, Spin, Alert, Pagination } from 'antd';

import CardMovie from '../CardMovie';
import MovieDbContext from '../../contexts/MovieDbContext';
import './MovieList.css';

export default class MoviesList extends Component {
    static defaultProps = {
        search: '',
        getRatedMovies: () => null,
        type: 'popular',
        ratedMovies: [],
        settings: { appSize: 0, numberOfRequests: 0, numberOfMoviesInRequest: 0, serverLimit: 0, serverSize: 0 },
        changeError: () => null,
        changeRatedMovies: () => null,
        sessionId: '',
        baseImgUrl: null,
    };

    static propTypes = {
        search: PropTypes.string,
        getRatedMovies: PropTypes.func,
        type: PropTypes.string,
        ratedMovies: PropTypes.arrayOf(
            PropTypes.objectOf(
                PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.arrayOf(PropTypes.number)])
            )
        ),
        settings: PropTypes.objectOf(PropTypes.number),
        changeError: PropTypes.func,
        changeRatedMovies: PropTypes.func,
        sessionId: PropTypes.string,
        baseImgUrl: PropTypes.string,
    };

    static contextType = MovieDbContext;

    static numberOfMoviesInRequest = (x, y) => {
        const gcd = (a, b) => (a % b === 0 ? b : gcd(b, a % b));
        const scm = (a, b) => (a * b) / gcd(a, b);
        return scm(x, y);
    };

    theMovieDB = this.context;

    method = {
        popular: (serverPage, ratedMovies) => this.theMovieDB.getPopularMovies(serverPage, ratedMovies),
        search: (serverPage, ratedMovies) => this.theMovieDB.searchMovies(this.props.search, serverPage, ratedMovies),
        rated: () => this.props.getRatedMovies(),
    };

    state = {
        isLoaded: false,
        data: [],
        serverData: [],
        appPage: 1,
        totalResults: 0,
        method: null,
        isRatingError: false,
    };

    componentDidUpdate(prevProps) {
        const { type, search, ratedMovies } = this.props;

        if (type !== prevProps.type) {
            this.setState(
                {
                    method: this.method[type],
                    isLoaded: false,
                    appPage: 1,
                },
                () => this.setMovies(1)
            );
            return;
        }

        if (search !== prevProps.search) {
            this.setState({ appPage: 1, isLoaded: false }, () => this.setMovies(1));
            return;
        }

        if (type === 'rated' && type === prevProps.type && ratedMovies.length !== prevProps.ratedMovies.length) {
            const {
                settings: { appSize },
            } = this.props;
            const { appPage } = this.state;
            const newAppPage = Math.ceil(ratedMovies.length / appSize);
            this.setMovies(newAppPage, false, newAppPage !== appPage);
        }
    }

    getMovies = async (method, page) => {
        const {
            settings: { numberOfRequests, serverLimit, serverSize },
            ratedMovies,
        } = this.props;
        const newState = { serverData: [] };
        let { totalPages } = this.state;
        let start = 0;

        const fetch = async (i, fn) => {
            await method(page + i, ratedMovies)
                .then((r) => {
                    if (page + i === 1) {
                        if (r.totalPages <= serverLimit) {
                            newState.totalPages = r.totalPages;
                            newState.totalResults = r.totalResults;
                        }
                        if (r.totalPages > serverLimit) {
                            newState.totalPages = serverLimit;
                            newState.totalResults = serverLimit * serverSize;
                        }
                    }
                    newState.serverData = [...newState.serverData, ...r.data];
                    return fn ? fn(newState.totalPages) : null;
                })
                .catch((err) => {
                    throw err;
                });
        };

        if (page === 1 && start === 0) {
            await fetch(start, (maxPage) => {
                totalPages = maxPage;
            });
            start += 1;
        }

        const promises = [];
        for (let i = start; i < numberOfRequests; i++) {
            if (page + i <= totalPages) {
                promises.push(
                    new Promise((resolve) => {
                        fetch(i, resolve);
                    })
                );
            }
        }

        await Promise.all(promises).catch((err) => {
            throw err;
        });
        return newState;
    };

    setMovies = async (newPage, oldPage) => {
        const { method, serverData } = this.state;
        const {
            type,
            settings: { appSize, numberOfMoviesInRequest, numberOfRequests },
            changeError,
        } = this.props;

        const dataGeneration = (start, data) => {
            return data.slice(start, start + appSize);
        };

        const errState = {
            serverData: null,
            totalResults: null,
            data: null,
            appPage: null,
        };

        if (type === 'rated' && newPage) {
            const dataStart = (newPage - 1) * appSize;
            if (!oldPage) {
                let newState;
                try {
                    const ratedMovies = await method();
                    newState = {
                        serverData: ratedMovies,
                        totalResults: ratedMovies.length,
                        appPage: newPage,
                    };
                    newState.data = dataGeneration(dataStart, newState.serverData);
                } catch {
                    newState = { ...errState };
                    changeError(3, 'moviesList');
                }
                this.setState(({ isLoaded }) => (!isLoaded ? { ...newState, isLoaded: true } : newState));
            }
            if (oldPage) {
                const data = dataGeneration(dataStart, serverData);
                this.setState(({ isLoaded }) => (!isLoaded ? { data, isLoaded: true } : { data }));
            }
            return;
        }

        const oldRequest = Math.ceil((oldPage * appSize) / numberOfMoviesInRequest);
        const newRequest = Math.ceil((newPage * appSize) / numberOfMoviesInRequest);
        const dataStart = (newPage - 1) * appSize - (newRequest - 1) * numberOfMoviesInRequest;

        if (oldRequest === newRequest) {
            const data = dataGeneration(dataStart, serverData);
            this.setState(({ isLoaded }) => (!isLoaded ? { data, isLoaded: true } : { data }));
            return;
        }

        const needNewServerData = async (start, page) => {
            this.setState({ isLoaded: false }, async () => {
                await this.getMovies(method, page)
                    .then((r) => this.setState({ ...r, data: dataGeneration(start, r.serverData), isLoaded: true }))
                    .catch(() => this.setState({ isLoaded: true, ...errState }, () => changeError(3, 'moviesList')));
            });
        };

        if (oldRequest !== newRequest || (!oldPage && newRequest)) {
            await needNewServerData(dataStart, numberOfRequests * (newRequest - 1) + 1);
        }
    };

    changePage = async (newPage) => {
        const { appPage } = this.state;
        this.setState({ appPage: newPage }, () => this.setMovies(newPage, appPage));
    };

    changeRating = async (data, rating, isNeedToDelete) => {
        const { changeRatedMovies } = this.props;
        const id = isNeedToDelete ? data : data.id;

        try {
            await this.theMovieDB.rateMovie(this.props.sessionId, id, rating, isNeedToDelete);
            if (isNeedToDelete) changeRatedMovies(id, isNeedToDelete);
            if (!isNeedToDelete) changeRatedMovies({ ...data, rating }, isNeedToDelete);
            return true;
        } catch {
            this.setState({ isRatingError: true }, () =>
                setTimeout(() => this.setState({ isRatingError: false }), 5000)
            );
            return false;
        }
    };

    render() {
        const { data, isLoaded, totalResults, appPage, isRatingError } = this.state;
        const {
            baseImgUrl,
            settings: { appSize },
        } = this.props;
        let res;

        if (!isLoaded) {
            res = <Spin tip='Loading' />;
        } else if (!data && isLoaded) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        } else if (data.length === 0 && isLoaded) {
            res = <Alert message='Nothing found for your request' type='warning' />;
        } else {
            res = (
                <RenderContent
                    data={data}
                    baseImgUrl={baseImgUrl}
                    changePage={this.changePage}
                    changeRating={this.changeRating}
                    totalResults={totalResults}
                    appPage={appPage}
                    pageSize={appSize}
                    isRatingError={isRatingError}
                />
            );
        }

        return res;
    }
}

function RenderContent({ data, baseImgUrl, changePage, changeRating, totalResults, appPage, pageSize, isRatingError }) {
    const { Item } = List;
    return (
        <>
            {isRatingError && (
                <Alert className='movieList__alert-banner' type='error' message="Something's wrong, try again" banner />
            )}
            <List
                grid={{ column: 2, xs: 1 }}
                className='movieList'
                dataSource={data}
                renderItem={(item) => (
                    <Item className='movieList__item'>
                        <CardMovie
                            movie={item}
                            baseImgUrl={baseImgUrl}
                            onChangeRating={(rating, isNeedToDelete) =>
                                changeRating(!isNeedToDelete ? item : item.id, rating, isNeedToDelete)
                            }
                        />
                    </Item>
                )}
            />
            <Pagination
                className='movieList__pagination'
                pageSize={pageSize}
                onChange={(page) => changePage(page)}
                total={totalResults}
                current={appPage}
                showSizeChanger={false}
                hideOnSinglePage
            />
        </>
    );
}
