# Three Pins - Crossword Website

This is the code which powers [Three Pins](http://www.threepins.org), a website for solving and creating cryptic crosswords online.
The site uses a Django back-end to store crosswords in a database, and a plain JavaScript front-end to interact with them.
The code may be useful to someone wanting to host their own crossword page. It's unlikely to be useful to anyone else.
Frankly, anyone geeky enough to work through the setup is probably geeky enough to write the whole thing from scratch.

## Prerequisities

* Python 3
* [PostgreSQL](https://wiki.archlinux.org/index.php/PostgreSQL). The user needs createdb/dropdb permission
* An SMTP account for the contact form

## Creating a dev environment

1. Clone this repo (or a fork of it) to your local machine.
2. Set some environment variables describing where to find the database and SMTP server

    ```bash
    export DATABASE_URL="postgres://<db_username>:<db_password>@localhost:5432/<db_name>"
    export EMAIL_HOST="<mail.provider.net>"
    export EMAIL_HOST_USER="<smtp_username>"
    export EMAIL_HOST_PASSWORD="<smtp_password>"
    export CONTACT_ADDRESS="<contact_form_recipient@example.com>"
    ```

3. Create a Python virtual environment and install dependencies

    ```bash
    pyvenv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

4. Set up Django assets

    ```
    python manage.py createsuperuser
    python manage.py migrate
    python manage.py collectstatic
    ```

5. Start the development server

    ```
    python manage.py runserver
    ```

6. The admin interface should be up and running locally at http://localhost:8000/admin. Log in with the Django superuser credentials.

## Load crosswords

The admin interface is the direct way to load puzzles into the database.
Puzzles created by [Crossword Compiler](http://www.crossword-compiler.com/) can be imported in XML format.
Blank grids for the crossword composer can be imported from [ipuz](http://www.ipuz.org) files.

## Running unit tests

The Python code has unit tests hooked into the framework.
```
python manage.py test
```

The JavaScript has QUnit tests. Open tests/js/qunit.html in a browser to run them.

## Deployment

The website is currently deployed on heroku. See <https://devcenter.heroku.com/articles/getting-started-with-python> to do the same.
The environment variables above all need to be set in the staging and production environments, plus [SECRET_KEY](https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/).

See also <https://devcenter.heroku.com/articles/heroku-postgresql#pg-push-and-pg-pull> to copy the database between development and staging.

## License

This project is licensed under the MIT License. See LICENSE.txt for details
