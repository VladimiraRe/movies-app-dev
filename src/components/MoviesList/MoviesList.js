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
        changeErrors: () => null,
        changeRatedMovies: () => null,
        sessionId: '',
        baseImgUrl: null,
        errors: {},
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
        changeErrors: PropTypes.func,
        changeRatedMovies: PropTypes.func,
        sessionId: PropTypes.string,
        baseImgUrl: PropTypes.string,
        errors: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.number])),
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
            const { appPage, totalResults } = this.state;
            const newLastPage = Math.ceil(ratedMovies.length / appSize);
            const newAppPage = appPage - 1 === newLastPage ? newLastPage : appPage;
            this.setMovies(newAppPage, false, { totalResults: totalResults - 1 });
        }
    }

    getMovies = async (method, page, errorHandle) => {
        const {
            settings: { numberOfRequests, serverLimit, serverSize },
            ratedMovies,
        } = this.props;
        const newState = { serverData: [] };
        let { totalPages } = this.state;
        let start = 0;

        const fetch = async (i, fn) => {
            await method(page + i, ratedMovies).then((r) => {
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
                        fetch(i, resolve).catch(errorHandle);
                    })
                );
            }
        }

        await Promise.all(promises);

        return newState;
    };

    setMovies = async (newPage, oldPage, newTotalResults) => {
        const { method, serverData } = this.state;
        const {
            type,
            settings: { appSize, numberOfMoviesInRequest, numberOfRequests },
            changeErrors,
        } = this.props;

        const dataGeneration = (start, data) => {
            return data.slice(start, start + appSize);
        };

        const errorHandle = () => {
            const errState = {
                serverData: null,
                totalResults: null,
                data: null,
                appPage: null,
            };

            const { type: errorsType, moviesList } = this.props.errors;
            if (!errorsType.find((el) => el === type) && moviesList < 3) {
                changeErrors(3, 'moviesList', type);
            }
            this.setState(({ isLoaded }) => (!isLoaded ? { ...errState, isLoaded: true } : errState));
            return false;
        };

        const noError = () => {
            const { type: errorsType, moviesList } = this.props.errors;
            if (moviesList >= 3 && errorsType.find((el) => el === type)) changeErrors(-3, 'moviesList', type);
        };

        if (type === 'rated' && newPage) {
            const dataStart = (newPage - 1) * appSize;
            if (!oldPage) {
                let newState;
                await method()
                    .then((ratedMovies) => {
                        if (!ratedMovies) {
                            errorHandle();
                            return;
                        }
                        newState = {
                            serverData: ratedMovies,
                            totalResults: ratedMovies.length,
                            appPage: newPage,
                        };
                        newState.data = dataGeneration(dataStart, newState.serverData);
                        noError();
                        this.setState(({ isLoaded }) => (!isLoaded ? { ...newState, isLoaded: true } : newState));
                    })
                    .catch(() => {
                        errorHandle();
                    });
            }
            if (oldPage) {
                const newState = { data: dataGeneration(dataStart, serverData) };
                if (newTotalResults) newState.totalResults = { ...newTotalResults };
                this.setState(({ isLoaded }) => (!isLoaded ? { ...newState, isLoaded: true } : newState));
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

        if (oldRequest !== newRequest || (!oldPage && newRequest)) {
            const page = numberOfRequests * (newRequest - 1) + 1;
            this.setState({ isLoaded: false }, async () => {
                await this.getMovies(method, page, () => errorHandle())
                    .then((res) => {
                        if (!res) {
                            errorHandle();
                            return;
                        }
                        noError();
                        this.setState({ ...res, data: dataGeneration(dataStart, res.serverData), isLoaded: true });
                    })
                    .catch(() => errorHandle());
            });
        }
    };

    changePage = async (newPage) => {
        const { appPage } = this.state;
        this.setState({ appPage: newPage }, () => this.setMovies(newPage, appPage));
    };

    changeRating = async (data, rating, isNeedToDelete) => {
        const { changeRatedMovies } = this.props;

        try {
            await this.theMovieDB.rateMovie(this.props.sessionId, data.id, rating, isNeedToDelete);
            const { serverData, data: stateData } = this.state;
            this.setState({
                serverData: serverData.map((el) => (el.id === data.id ? { ...el, rating } : el)),
                data: stateData.map((el) => (el.id === data.id ? { ...el, rating } : el)),
            });
            if (isNeedToDelete) changeRatedMovies(data.id, isNeedToDelete);
            if (!isNeedToDelete) changeRatedMovies({ ...data, rating });
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
            type,
            settings: { appSize },
        } = this.props;
        let res;
        const alertMessage =
            type === 'rated' ? 'Movies will appear here when you rate them' : 'Nothing found for your request';

        if (!isLoaded) {
            res = <Spin tip='Loading' />;
        } else if (isLoaded && !data) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        } else if (data.length === 0 && isLoaded) {
            res = <Alert message={alertMessage} type='warning' />;
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
                            onChangeRating={(rating, isNeedToDelete) => changeRating(item, rating, isNeedToDelete)}
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
