.PHONY: up down build restart logs shell db-shell migrate seed jwt-keys cache-clear

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

restart:
	docker compose down && docker compose up -d

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

shell:
	docker compose exec backend bash

db-shell:
	docker compose exec db psql -U app community_day

migrate:
	docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction

diff:
	docker compose exec backend php bin/console doctrine:migrations:diff

seed:
	docker compose exec backend php bin/console doctrine:fixtures:load --no-interaction --purge-with-truncate

jwt-keys:
	docker compose exec backend php bin/console lexik:jwt:generate-keypair --skip-if-exists

cache-clear:
	docker compose exec backend php bin/console cache:clear

import-users:
	docker compose exec backend php bin/console app:import-users $(file)

init: build up jwt-keys migrate seed
	@echo "Backend ready at http://localhost:8000"
