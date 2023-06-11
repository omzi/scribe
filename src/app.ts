/* eslint-disable quotes */
import http from 'http';
import path from 'path';
import csrf from 'csurf';
import express, { Request, Response } from 'express';
import flash from 'connect-flash';
import hljs from 'highlight.js';
import { router } from '@root/router';
import compression from 'compression';
import session, { SessionOptions } from 'express-session';
import { createMarkdown } from 'safe-marked';
import { config } from '@root/config';
const markdown = createMarkdown({
	marked: {
		headerIds: true,
		highlight: (code, lang) => {
			code = code
				.replace(/&gt;/g, '>')
				.replace(/&lt;/g, '<')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'");

			const language = hljs.getLanguage(lang) ? lang : 'plaintext';
			return hljs.highlight(code, { language }).value;
		}
	}
});

const sessionOptions: SessionOptions = {
	secret: config.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 30, // Expires in 30 days
		httpOnly: true
	}
};

const app = express();

app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (config.IS_PRODUCTION) {
	sessionOptions.cookie!.secure = true; // Serve secure cookies in production
	app.set('trust proxy', 1); // Trust first proxy
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
!config.IS_PRODUCTION && app.use(require('morgan')('dev'));

app.use(session(sessionOptions));
app.use(flash());
app.use((req, res, next) => {
	res.locals.successMessages = req.flash('successMessages');
	res.locals.errorMessages = req.flash('errorMessages');
	res.locals.infoMessages = req.flash('infoMessages');
	res.locals.newUser = req.flash('newUser');
	res.locals.user = req.session.user;
	req.currentUserId = req.session.user?.id;

	res.locals.convertMarkdown = (content: string) => {
		return markdown(content);
	};

	next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// EJS helpers
app.locals.helpers = {
	capitalise: ([first, ...rest]: string) => first.toUpperCase() + rest.join(''),
	formatNumber: (number: number) => {
		if (number < 1000) return number;
		const suffixes = ['', 'K', 'M', 'B', 'T'];
		const suffixIndex = Math.floor(Math.log10(number) / 3);
		const formattedNumber = (number / Math.pow(10, suffixIndex * 3)).toFixed(1);

		return formattedNumber + suffixes[suffixIndex];
	},
	formatDate: (date: string | number | Date) => {
		const formattedDate = new Date(date).toDateString();
		const ordinal = (n: number) => (n < 11 || n > 13 ? [`${n}st`, `${n}nd`, `${n}rd`, `${n}th`][Math.min((n - 1) % 10, 3)] : `${n}th`);

		return formattedDate.replace(/(\w{3}) (\w{3}) (\d{2}) (\d{4})/, (_, day, month, date, year) => {
			return `${day}, ${month} ${ordinal(Number(date))} ${year}`;
		});
	}
};

app.use(csrf());
app.use((req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use('/', router);

app.use((req, res) => {
	res.status(404).render('404', { URL: req.originalUrl });
});

app.use((error: Error & { code?: string }, req: Request, res: Response) => {
	console.log('App Error :>>', error);
	if (error) {
		if (error.name === 'ForbiddenError' && error.code === 'EBADCSRFTOKEN') {
			req.flash('errorMessages', 'Invalid CSRF token');
			req.session.save(() => {
				req.method === 'GET' ? res.redirect(req.originalUrl) : res.redirect('/');
			});
		} else {
			res.status(500).render('404', { URL: req.originalUrl });
		}
	} else {
		res.status(404).render('404', { URL: req.originalUrl });
	}
});

export default http.createServer(app);
