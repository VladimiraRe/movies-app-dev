/* eslint-disable max-len */
import { Component } from 'react';
import { Layout, Alert, Input } from 'antd';
import { debounce } from 'lodash';

import TheMovieDB from '../../requests/TheMovieDB';
import GenresContext from '../../contexts/GenresContext';
import MovieDbContext from '../../contexts/MovieDbContext';
import MoviesList from '../MoviesList';
import Menu from '../Menu';
import ErrorBoundary from '../ErrorBoundary';
import './MoviesApp.css';

export default class MoviesApp extends Component {
    static numberOfMoviesInRequest = (x, y) => {
        const gcd = (a, b) => (a % b === 0 ? b : gcd(b, a % b));
        const scm = (a, b) => (a * b) / gcd(a, b);
        return scm(x, y);
    };

    theMovieDB = new TheMovieDB();

    settings = {
        localStorage: window.localStorage,
        appSize: 6,
        numberOfMoviesInRequest: null,
        numberOfRequests: null,
    };

    state = {
        type: null,
        search: '',
        input: '',
        isOnline: navigator.onLine,
        guestSessionId: null,
        baseImgUrl: null,
        genres: [],
        ratedMovies: [],
        errors: { app: 0, moviesList: 0, message: null, type: [], disable: null },
    };

    async componentDidMount() {
        this.settings.numberOfMoviesInRequest = MoviesApp.numberOfMoviesInRequest(
            this.settings.appSize,
            this.theMovieDB.serverSize
        );
        this.settings.numberOfRequests = this.settings.numberOfMoviesInRequest / this.theMovieDB.serverSize;
        this.debounceSearch = debounce((input) => this.startSearch(input), 2000);

        const newState = { type: 'popular' };
        const errorsState = { errors: 0 };
        newState.guestSessionId = await this.enterGuestSession().catch(() => {
            errorsState.errors += 1;
            errorsState.message = 'Unable to create a guest session, film rating is not available';
            errorsState.disable = ['rating'];
            newState.ratedMovies = [];
            return null;
        });
        if (newState.guestSessionId)
            newState.ratedMovies = await this.theMovieDB.getRatedMovies(newState.guestSessionId, () => {
                errorsState.errors += 1;
                errorsState.message = 'The list of rated films is not available';
                errorsState.disable = ['rating'];
                return [];
            });
        newState.genres = await this.theMovieDB.getGenres().catch(() => {
            errorsState.errors += 1;
            return [];
        });
        newState.baseImgUrl = await this.theMovieDB.getBaseImgUrl().catch(() => {
            errorsState.errors += 1;
            return null;
        });
        if (errorsState.errors > 0) {
            const { errors: prevErrorsState } = this.state;
            if (errorsState.errors === 1 && errorsState.message) {
                newState.errors = { ...prevErrorsState, ...errorsState };
            } else {
                newState.errors = { ...prevErrorsState, app: errorsState.errors };
            }
        }
        this.setState(newState);
    }

    componentDidUpdate(prevProps, prevState) {
        const { input, type } = this.state;
        if (prevState.input !== input && prevState.type === type) {
            this.debounceSearch(input);
        }
    }

    changeErrors = (value, name, type) => {
        this.setState(({ errors }) => {
            const newState = { [name]: errors[name] + value };
            if (type) {
                if (value > 0) newState.type = [...errors.type, type];
                else newState.type = errors.type.filter((el) => el !== type);
            }
            return { errors: { ...errors, ...newState } };
        });
    };

    changeInput = (input) => {
        this.setState({ input });
    };

    startSearch = (value) => {
        const newValue = value.trim();
        this.setState(({ search, type }) => {
            if ((search === newValue && newValue !== '') || (newValue === '' && type === 'popular')) return false;
            if (newValue === '' && type !== 'popular') return { type: 'popular' };
            return type !== 'search' ? { search: newValue, type: 'search' } : { search: newValue };
        });
    };

    changeType = (newType) => {
        this.setState(({ type, search, input }) => {
            if (type === newType) return false;
            const newState = { type: newType };
            if (search !== '' && newType === 'popular') newState.search = '';
            if (input !== '' && newType === 'popular') newState.input = '';
            return newState;
        });
    };

    changeRatedMovies = (data, isNeedToDelete) => {
        if (isNeedToDelete) {
            this.setState(({ ratedMovies }) => ({ ratedMovies: ratedMovies.filter((el) => el.id !== data) }));
            return;
        }
        this.setState(({ ratedMovies }) => {
            let isNewMovie = true;
            const newData = ratedMovies.map((el) => {
                if (el.id !== data.id) return el;
                isNewMovie = false;
                return { ...el, rating: data.rating };
            });
            if (!isNewMovie) return { ratedMovies: newData };
            return { ratedMovies: [...ratedMovies, data] };
        });
    };

    getRatedMovies = async () => {
        const { guestSessionId, type } = this.state;
        const res = await this.theMovieDB
            .getRatedMovies(guestSessionId, () => {
                if (type === 'rated') {
                    this.setState({ ratedMovies: [] });
                    return false;
                }
                this.setState(({ errors }) => ({ ratedMovies: [], errors: { ...errors, app: errors.app + 1 } }));
                return false;
            })
            .then((ratedMovies) => {
                this.setState({ ratedMovies });
                return ratedMovies;
            });

        return res;
    };

    enterGuestSession = async () => {
        const { localStorage } = this.settings;
        let guestSessionId = localStorage.getItem('guestSessionId');
        if (!guestSessionId) {
            guestSessionId = await this.theMovieDB
                .createGuestSession()
                .then((value) => {
                    localStorage.setItem('guestSessionId', value);
                    return localStorage.getItem('guestSessionId');
                })
                .catch((err) => {
                    throw err;
                });
        }
        return guestSessionId;
    };

    render() {
        const { search, isOnline, guestSessionId, type, genres, input, baseImgUrl, ratedMovies, errors } = this.state;
        const { localStorage, ...appSettings } = this.settings;
        const { serverSize, serverLimit } = this.theMovieDB;
        const settings = { ...appSettings, serverSize, serverLimit };

        if (isOnline) {
            window.addEventListener('offline', () => this.setState({ isOnline: false }));
        } else {
            window.addEventListener('online', () => this.setState({ isOnline: true }));
        }

        return (
            <Layout className='moviesApp'>
                {isOnline ? (
                    <Content
                        baseImgUrl={baseImgUrl}
                        ratedMovies={ratedMovies}
                        changeRatedMovies={this.changeRatedMovies}
                        getRatedMovies={this.getRatedMovies}
                        changeType={this.changeType}
                        input={input}
                        search={search}
                        guestSessionId={guestSessionId}
                        type={type}
                        settings={settings}
                        changeInput={this.changeInput}
                        changeErrors={this.changeErrors}
                        context={{ genres, theMovieDB: this.theMovieDB }}
                        errors={errors}
                    />
                ) : (
                    <Alert message='Oops' description='No internet connection' type='error' />
                )}
            </Layout>
        );
    }
}

function Content({
    baseImgUrl,
    ratedMovies,
    changeRatedMovies,
    getRatedMovies,
    search,
    input,
    type,
    guestSessionId,
    settings,
    changeInput,
    changeErrors,
    context,
    changeType,
    errors,
}) {
    const { message, type: errorsType, disable, ...allErrors } = errors;
    const countedErrors = Object.values(allErrors).reduce((acc, el) => {
        return acc + el;
    }, 0);
    const isNeedDisable = !!(disable && disable.find((el) => el === 'rating'));
    const errorMessage =
        countedErrors === 1 && message ? message : "The app doesn't work correctly, we recommend to restart it";

    return (
        <>
            {countedErrors > 0 && countedErrors <= 2 && (
                <Alert className='moviesApp__error-banner' message={errorMessage} banner closable />
            )}
            {countedErrors > 2 && (
                <Alert
                    className='moviesApp__error-banner'
                    type='error'
                    message='Critical bugs have been found, restart the app'
                    banner
                />
            )}
            <ErrorBoundary component='menu'>
                <Menu className='moviesApp__menu' onClick={changeType} type={type} isNeedDisable={isNeedDisable} />
            </ErrorBoundary>
            <ErrorBoundary component='search'>
                {type !== 'rated' && (
                    <Input
                        onChange={(e) => changeInput(e.target.value)}
                        value={input}
                        placeholder='Type to search...'
                    />
                )}
            </ErrorBoundary>
            <ErrorBoundary component='list'>
                <GenresContext.Provider value={context.genres}>
                    <MovieDbContext.Provider value={context.theMovieDB}>
                        <MoviesList
                            baseImgUrl={baseImgUrl}
                            ratedMovies={ratedMovies}
                            changeRatedMovies={changeRatedMovies}
                            getRatedMovies={getRatedMovies}
                            search={search}
                            type={type}
                            sessionId={guestSessionId}
                            settings={settings}
                            changeErrors={changeErrors}
                            errors={{ type: errorsType, moviesList: allErrors.moviesList }}
                        />
                    </MovieDbContext.Provider>
                </GenresContext.Provider>
            </ErrorBoundary>
        </>
    );
}
