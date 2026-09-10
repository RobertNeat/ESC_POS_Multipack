# Założenia ogólne

Pipeline GitHub Actions jest niezależną warstwą automatyzacji. Aplikacje
pozostają właścicielem kodu, zależności, testów i komend jakości; pipeline
wywołuje tylko kontrakt opisany w `projects.json`.

Pipeline sprawdza, buduje i wdraża aplikacje znajdujące się w tym repozytorium,
nie zewnętrzne projekty. Działa dla wielu technologii (Node.js/Angular/NestJS,
Python i Spring Boot) i traktuje je jako jeden zestaw współpracujących
kontenerów. Ten sam commit SHA identyfikuje cały zestaw obrazów.

## Ścieżki

- `check` — walidacja konfiguracji, kontrola jakości, testy, budowanie aplikacji,
  SAST i skanowanie zależności/obrazu;
- `build` — budowa obrazu, skan Trivy i zapis obrazu w lokalnym rejestrze pod
  pełnym SHA;
- `deploy` — uruchomienie dokładnie tego zestawu obrazów na produkcji;
- `release` — publikacja obrazów wybranego SHA do GHCR;
- `github_release` — utworzenie wydania o nazwie taga.

Workflowy korzystają z self-hosted runnera. Obrazy są niezmienne, `latest` nie
jest używany, a operacje build/deploy/release są serializowane.

## Metadane OCI obrazów

Publiczne metadane obrazów są definiowane w `deploy/config.env` przez zmienne
`IMAGE_TITLE`, `IMAGE_DESCRIPTION`, `IMAGE_VENDOR`, `IMAGE_LICENSES` i
`IMAGE_SOURCE`. Pipeline
wczytuje ten plik podczas budowania i przekazuje wartości jako `--build-arg` do
każdego Dockerfile. Dockerfile zapisuje je jako etykiety
`org.opencontainers.image.*` w finalnym obrazie. `IMAGE_SOURCE` wskazuje
repozytorium źródłowe, dzięki czemu ZOT może poprawnie wyświetlić link do
repozytorium.

`docker push` nie zmienia etykiet, tylko publikuje konfigurację obrazu razem z
warstwami. Skrypty wysyłające do ZOT i GHCR sprawdzają przed publikacją, czy
etykiety obrazu odpowiadają `deploy/config.env`.
