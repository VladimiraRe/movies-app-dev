import { Component } from 'react';
import { List, Spin, Alert, Pagination } from 'antd';

import CardMovie from '../CardMovie';
import TheMovieDB from '../../requests/TheMovieDB';
import './MovieList.css';

export default class MoviesList extends Component {
    static numberOfMoviesInRequest = (x, y) => {
        const gcd = (a, b) => (a % b === 0 ? b : gcd(b, a % b));
        const scm = (a, b) => (a * b) / gcd(a, b);
        return scm(x, y);
    };

    theMovieDB = new TheMovieDB();

    method = {
        popular: (sessionId, serverPage) => this.theMovieDB.getPopularMovies(sessionId, serverPage),
        search: (sessionId, serverPage) => this.theMovieDB.searchMovies(sessionId, serverPage),
        rated: (sessionId) => this.theMovieDB.getRatedMovies(sessionId),
    };

    state = {
        isLoaded: true,
        data: [],
        serverData: [],
        baseImgUrl: '',
        appPage: 1,
        totalResults: null,
        method: null,
    };

    async componentDidMount() {
        const { type } = this.props;

        await this.theMovieDB
            .getBaseImgUrl()
            .then((baseImgUrl) => {
                this.setState(
                    {
                        method: this.method[type],
                        appPage: 1,
                        baseImgUrl,
                    },
                    () => this.setMovies(1)
                );
            })
            .catch(() => {
                this.setState({
                    baseImgUrl: false,
                });
            });
    }

    componentDidUpdate(prevProps) {
        let { search: currentSearch } = this.props;
        const { type: currentType } = this.props;
        currentSearch = currentSearch.split(' ').join('');

        if (currentType !== prevProps.type) {
            this.setState(
                {
                    method: this.method[currentType],
                    isLoaded: true,
                    appPage: 1,
                },
                () => this.setMovies(1, true)
            );
        }

        if (currentSearch && prevProps.search !== currentSearch) {
            this.setState({ appPage: 1, isLoaded: true }, () => this.setMovies(1, true));
        }
    }

    getMovies = async (method, page, isNew) => {
        const {
            sessionId,
            settings: { numberOfRequests, serverSize, serverLimit },
        } = this.props;

        const compileState = { serverData: [] };
        const requests = [];
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < numberOfRequests; i++) {
            if (page + i <= serverLimit) {
                requests.push(
                    new Promise((resolve) => {
                        method(sessionId, page + i).then((res) => {
                            if (isNew && i === 0) {
                                const totalResults =
                                    res.totalPages <= serverLimit
                                        ? res.totalPages * serverSize
                                        : serverLimit * serverSize;
                                compileState.totalResults = totalResults;
                            }
                            compileState.serverData = [...compileState.serverData, ...res.data];
                            return resolve();
                        });
                    })
                );
            }
        }
        const newState = await Promise.all(requests)
            .then(() => {
                return compileState;
            })
            .catch(() =>
                this.setState({
                    data: false,
                    isLoaded: false,
                })
            );
        return newState;
    };

    setMovies = async (newPage, oldPage) => {
        const { method } = this.state;
        const { appSize, numberOfMoviesInRequest, numberOfRequests } = this.props.settings;

        const oldRequest = Math.ceil((oldPage * appSize) / numberOfMoviesInRequest);
        const newRequest = Math.ceil((newPage * appSize) / numberOfMoviesInRequest);
        const dataStart = (newPage - 1) * appSize - (newRequest - 1) * numberOfMoviesInRequest;

        if (oldRequest === newRequest) {
            const newState = { isLoaded: false };
            const { serverData } = this.state;
            newState.data = serverData.slice(dataStart, dataStart + appSize);
            this.setState(newState);
            return;
        }

        if (oldRequest !== newRequest || (!oldPage && newRequest)) {
            this.setState({ isLoaded: true }, async () => {
                const newState = await this.getMovies(method, numberOfRequests * (newRequest - 1) + 1, !oldPage);
                const { serverData } = newState;
                newState.isLoaded = false;
                newState.data = serverData.slice(dataStart, dataStart + appSize);
                this.setState(newState);
            });
        }
    };

    changePage = async (newPage) => {
        const { appPage } = this.state;
        this.setState({ appPage: newPage }, () => this.setMovies(newPage, appPage));
    };

    changeRating = async (id, rating) => {
        await this.theMovieDB.rateMovie(this.props.sessionId, id, rating);
    };

    render() {
        const { data, baseImgUrl, isLoaded, totalResults, appPage } = this.state;
        const {
            settings: { appSize },
        } = this.props;
        let res;

        if (isLoaded) {
            res = <Spin tip='Loading' />;
        } else if (!data && !isLoaded) {
            res = <Alert message='Oops' description='Sorry, something is wrong. Please try again later' type='error' />;
        } else if (data.length === 0 && !isLoaded) {
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
                />
            );
        }

        return res;
    }
}

function RenderContent({ data, baseImgUrl, changePage, changeRating, totalResults, appPage, pageSize }) {
    const { Item } = List;
    return (
        <>
            <List
                grid={{ gutter: 16, column: 2, xs: 1 }}
                className='movieList'
                dataSource={data}
                renderItem={(item) => (
                    <Item>
                        <CardMovie
                            movie={item}
                            baseImgUrl={baseImgUrl}
                            onChangeRating={(rating) => changeRating(item.id, rating)}
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
